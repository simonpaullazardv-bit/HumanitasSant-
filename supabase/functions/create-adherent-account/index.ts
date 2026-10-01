import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function randomPart(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function temporaryPassword() {
  return `Hm!${randomPart(5)}-${randomPart(5)}-${randomPart(3)}`;
}

function username() {
  return `HUM-A-${randomPart(8)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!supabaseUrl || !serviceRoleKey || !authHeader) {
    return json({ error: "Configuration ou authentification manquante." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: callerData, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !callerData.user) return json({ error: "Session invalide." }, 401);

  const callerId = callerData.user.id;
  const { data: roleRows, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId);
  if (roleError) return json({ error: "Vérification des droits impossible." }, 500);

  const allowed = new Set(["super_admin", "administrateur", "coordonnateur", "agent_humanitas"]);
  if (!(roleRows ?? []).some((row) => allowed.has(row.role))) {
    return json({ error: "Vous n'avez pas le droit de créer un compte adhérent." }, 403);
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return json({ error: "Données invalides." }, 400);
  }

  const nom = typeof input.nom === "string" ? input.nom.trim() : "";
  const ville = typeof input.ville === "string" ? input.ville.trim() : "";
  if (!nom || !ville) return json({ error: "Nom et ville sont obligatoires." }, 400);

  const email = typeof input.email === "string" && input.email.trim() ? input.email.trim() : null;
  const categoryId =
    typeof input.categorie_id === "string" && input.categorie_id ? input.categorie_id : null;
  const requestedUsername = username();
  const tempPassword = temporaryPassword();
  const authEmail = `${requestedUsername.toLowerCase()}@accounts.humanitas.local`;

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: authEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: [nom, input.postnom, input.prenom].filter(Boolean).join(" "),
      phone: input.telephone ?? null,
      humanitas_managed_account: true,
    },
  });
  if (authError || !authUser.user) {
    return json({ error: authError?.message ?? "Création du compte impossible." }, 400);
  }

  const authUserId = authUser.user.id;
  try {
    const profilePayload = {
      username: requestedUsername,
      email,
      phone: typeof input.telephone === "string" ? input.telephone.trim() || null : null,
      full_name: [nom, input.postnom, input.prenom].filter(Boolean).join(" "),
      force_password_change: true,
      password_initialized_at: null,
      is_active: true,
    };
    const { error: profileError } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", authUserId);
    if (profileError) throw profileError;

    const adherentPayload: Record<string, unknown> = {
      ...input,
      nom,
      ville,
      user_id: authUserId,
      created_by: callerId,
      email,
      categorie_id: categoryId,
      statut: "en_attente",
    };
    const { data: adherent, error: adherentError } = await admin
      .from("adherents")
      .insert(adherentPayload)
      .select("*")
      .single();
    if (adherentError || !adherent) throw adherentError ?? new Error("Dossier adhérent non créé.");

    if (categoryId) {
      const { data: category, error: categoryError } = await admin
        .from("categories_adhesion")
        .select("prix_usd")
        .eq("id", categoryId)
        .single();
      if (categoryError) throw categoryError;
      const { error: adhesionError } = await admin.from("adhesions").insert({
        adherent_id: adherent.id,
        categorie_id: categoryId,
        date_debut: input.date_adhesion || new Date().toISOString().slice(0, 10),
        date_fin: input.date_expiration || null,
        statut: "en_attente",
        montant_usd: Number(category.prix_usd ?? 0),
      });
      if (adhesionError) throw adhesionError;
    }

    return json(
      {
        row: adherent,
        credentials: {
          username: requestedUsername,
          temporaryPassword: tempPassword,
        },
      },
      201,
    );
  } catch (error) {
    await admin.auth.admin.deleteUser(authUserId);
    return json(
      { error: error instanceof Error ? error.message : "Création du dossier impossible." },
      400,
    );
  }
});

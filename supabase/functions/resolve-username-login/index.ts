import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Méthode non autorisée." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return response({ error: "Configuration indisponible." }, 500);

  let username = "";
  try {
    const body = await req.json();
    username = typeof body.username === "string" ? body.username.trim() : "";
  } catch {
    return response({ error: "Identifiant invalide." }, 400);
  }
  if (!username || username.includes("@"))
    return response({ error: "Identifiant Humanitas invalide." }, 400);

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error } = await admin
    .from("profiles")
    .select("username")
    .ilike("username", username)
    .maybeSingle();
  if (error) return response({ error: "Résolution de l'identifiant impossible." }, 500);
  if (!profile?.username) return response({ error: "Identifiant ou mot de passe incorrect." }, 404);

  return response({ email: `${profile.username.toLowerCase()}@accounts.humanitas.local` });
});

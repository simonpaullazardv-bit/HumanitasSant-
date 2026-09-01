/**
 * Accès aux données du module Partenaires.
 * Les règles métier — numérotation, contrat valide obligatoire, cloisonnement
 * des données par partenaire — sont appliquées en base (triggers + RLS).
 */
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PartenaireType =
  | "hopital"
  | "structure_sanitaire"
  | "dispensaire"
  | "laboratoire"
  | "pharmacie"
  | "centre_bien_etre"
  | "entreprise";

export type StatutPartenaire = "en_attente" | "actif" | "suspendu" | "resilie";
export type StatutContrat = "brouillon" | "actif" | "suspendu" | "expire" | "resilie";
export type StatutPec = "soumise" | "en_revue" | "approuvee" | "refusee" | "executee" | "annulee";
export type StatutFacture = "brouillon" | "soumise" | "validee" | "payee" | "rejetee";

export const PARTENAIRE_TYPES: { value: PartenaireType; label: string }[] = [
  { value: "hopital", label: "Hôpital" },
  { value: "structure_sanitaire", label: "Structure sanitaire" },
  { value: "dispensaire", label: "Dispensaire" },
  { value: "laboratoire", label: "Laboratoire" },
  { value: "pharmacie", label: "Pharmacie" },
  { value: "centre_bien_etre", label: "Centre bien-être" },
  { value: "entreprise", label: "Entreprise" },
];

export const STATUTS_PARTENAIRE: { value: StatutPartenaire; label: string }[] = [
  { value: "en_attente", label: "En attente" },
  { value: "actif", label: "Actif" },
  { value: "suspendu", label: "Suspendu" },
  { value: "resilie", label: "Résilié" },
];

export const STATUTS_CONTRAT: { value: StatutContrat; label: string }[] = [
  { value: "brouillon", label: "Brouillon" },
  { value: "actif", label: "Actif" },
  { value: "suspendu", label: "Suspendu" },
  { value: "expire", label: "Expiré" },
  { value: "resilie", label: "Résilié" },
];

export interface PartenaireRow {
  id: string;
  numero: string | null;
  nom: string;
  slug: string;
  type: PartenaireType;
  categorie: string | null;
  description: string | null;
  logo_url: string | null;
  adresse: string | null;
  commune: string | null;
  ville: string;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  responsable_nom: string | null;
  responsable_fonction: string | null;
  responsable_telephone: string | null;
  responsable_email: string | null;
  statut: StatutPartenaire;
  conventionne: boolean;
  date_convention: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ContratRow {
  id: string;
  numero: string;
  partenaire_id: string;
  objet: string | null;
  date_debut: string;
  date_fin: string | null;
  statut: StatutContrat;
  prestations_autorisees: string[];
  conditions: Record<string, unknown>;
  plafond_acte_usd: number | null;
  plafond_mensuel_usd: number | null;
  plafond_annuel_usd: number | null;
  taux_couverture: number;
  signe_humanitas_par: string | null;
  signe_humanitas_le: string | null;
  signe_partenaire_par: string | null;
  signe_partenaire_le: string | null;
  notes: string | null;
  created_at: string;
}

export interface PriseEnChargeRow {
  id: string;
  numero: string;
  partenaire_id: string;
  contrat_id: string | null;
  adherent_id: string | null;
  beneficiaire_id: string | null;
  carte_id: string | null;
  motif: string;
  prestations: string[];
  montant_estime_usd: number;
  montant_approuve_usd: number | null;
  statut: StatutPec;
  decision_motif: string | null;
  decide_le: string | null;
  created_at: string;
}

export interface FactureRow {
  id: string;
  numero: string;
  reference_partenaire: string | null;
  partenaire_id: string;
  contrat_id: string | null;
  prise_en_charge_id: string | null;
  periode: string | null;
  montant_usd: number;
  montant_valide_usd: number | null;
  montant_paye_usd: number;
  statut: StatutFacture;
  motif_rejet: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  partenaire_id: string;
  titre: string;
  message: string;
  niveau: string;
  is_lue: boolean;
  created_at: string;
}

export interface HistoriqueRow {
  id: string;
  partenaire_id: string;
  contrat_id: string | null;
  evenement: string;
  ancien_statut: string | null;
  nouveau_statut: string | null;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  partenaire_id: string;
  contrat_id: string | null;
  type: string;
  nom: string;
  bucket: string;
  storage_path: string;
  created_at: string;
}

const db = {
  from: (table: string) => supabase.from(table as never),
  rpc: (fn: string, args?: Record<string, unknown>) =>
    supabase.rpc(fn as never, args as never) as Promise<{ data: unknown; error: unknown }>,
  storage: supabase.storage,
};

/* ------------------------------------------------------------------ */
/* Lectures                                                            */
/* ------------------------------------------------------------------ */

export const partenairesAdminQuery = (
  filters: {
    type?: PartenaireType | "tous";
    statut?: StatutPartenaire | "tous";
    search?: string;
  } = {},
) =>
  queryOptions({
    queryKey: ["partenaires", "admin", filters],
    queryFn: async (): Promise<PartenaireRow[]> => {
      let request = db
        .from("partenaires")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (filters.type && filters.type !== "tous") request = request.eq("type", filters.type);
      if (filters.statut && filters.statut !== "tous")
        request = request.eq("statut", filters.statut);
      if (filters.search) request = request.ilike("nom", `%${filters.search}%`);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as PartenaireRow[];
    },
  });

export const partenaireQuery = (id: string | undefined) =>
  queryOptions({
    queryKey: ["partenaires", "one", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<PartenaireRow | null> => {
      const { data, error } = await db.from("partenaires").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data ?? null) as PartenaireRow | null;
    },
  });

export const contratsQuery = (partenaireId?: string) =>
  queryOptions({
    queryKey: ["partenaires", "contrats", partenaireId ?? "all"],
    queryFn: async (): Promise<ContratRow[]> => {
      let request = db
        .from("contrats_partenaires")
        .select("*")
        .order("date_debut", { ascending: false })
        .limit(500);
      if (partenaireId) request = request.eq("partenaire_id", partenaireId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as ContratRow[];
    },
  });

export const pecQuery = (filters: { partenaireId?: string; statut?: StatutPec | "tous" } = {}) =>
  queryOptions({
    queryKey: ["partenaires", "pec", filters],
    queryFn: async (): Promise<PriseEnChargeRow[]> => {
      let request = db
        .from("prises_en_charge")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (filters.partenaireId) request = request.eq("partenaire_id", filters.partenaireId);
      if (filters.statut && filters.statut !== "tous")
        request = request.eq("statut", filters.statut);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as PriseEnChargeRow[];
    },
  });

export const facturesQuery = (partenaireId?: string) =>
  queryOptions({
    queryKey: ["partenaires", "factures", partenaireId ?? "all"],
    queryFn: async (): Promise<FactureRow[]> => {
      let request = db
        .from("factures_partenaires")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (partenaireId) request = request.eq("partenaire_id", partenaireId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as FactureRow[];
    },
  });

export const notificationsQuery = (partenaireId: string | undefined) =>
  queryOptions({
    queryKey: ["partenaires", "notifications", partenaireId],
    enabled: Boolean(partenaireId),
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await db
        .from("partenaire_notifications")
        .select("*")
        .eq("partenaire_id", partenaireId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

export const historiquePartenaireQuery = (partenaireId: string | undefined) =>
  queryOptions({
    queryKey: ["partenaires", "historique", partenaireId],
    enabled: Boolean(partenaireId),
    queryFn: async (): Promise<HistoriqueRow[]> => {
      const { data, error } = await db
        .from("partenaire_historique")
        .select(
          "id, partenaire_id, contrat_id, evenement, ancien_statut, nouveau_statut, created_at",
        )
        .eq("partenaire_id", partenaireId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as HistoriqueRow[];
    },
  });

export const documentsPartenaireQuery = (partenaireId: string | undefined) =>
  queryOptions({
    queryKey: ["partenaires", "documents", partenaireId],
    enabled: Boolean(partenaireId),
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await db
        .from("partenaire_documents")
        .select("*")
        .eq("partenaire_id", partenaireId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });

/** Partenaires rattachés au compte connecté (espace partenaire). */
export const monPartenaireQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["partenaires", "mon-espace", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<PartenaireRow | null> => {
      const { data, error } = await db
        .from("partenaire_membres")
        .select("partenaire_id")
        .eq("user_id", userId!)
        .eq("is_active", true)
        .limit(1);
      if (error) throw error;
      const link = (data ?? [])[0] as { partenaire_id: string } | undefined;
      if (!link) return null;
      const { data: partenaire, error: err2 } = await db
        .from("partenaires")
        .select("*")
        .eq("id", link.partenaire_id)
        .maybeSingle();
      if (err2) throw err2;
      return (partenaire ?? null) as PartenaireRow | null;
    },
  });

/* ------------------------------------------------------------------ */
/* Écritures                                                           */
/* ------------------------------------------------------------------ */

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useSavePartenaire() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PartenaireRow> & { nom: string }) => {
      const body = { ...payload, slug: payload.slug || slugify(payload.nom) };
      const { data, error } = payload.id
        ? await db.from("partenaires").update(body).eq("id", payload.id).select("*").single()
        : await db.from("partenaires").insert(body).select("*").single();
      if (error) throw error;
      return data as PartenaireRow;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires"] }),
  });
}

export function useSaveContrat() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ContratRow> & { partenaire_id: string }) => {
      const { data, error } = payload.id
        ? await db
            .from("contrats_partenaires")
            .update(payload)
            .eq("id", payload.id)
            .select("*")
            .single()
        : await db.from("contrats_partenaires").insert(payload).select("*").single();
      if (error) throw error;
      return data as ContratRow;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires"] }),
  });
}

export function useCreerPriseEnCharge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      partenaire_id: string;
      adherent_id?: string | null;
      beneficiaire_id?: string | null;
      carte_id?: string | null;
      motif: string;
      prestations?: string[];
      montant_estime_usd: number;
    }) => {
      const { data, error } = await db
        .from("prises_en_charge")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as PriseEnChargeRow;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires", "pec"] }),
  });
}

export function useDeciderPriseEnCharge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      statut: StatutPec;
      montant_approuve_usd?: number | null;
      decision_motif?: string | null;
    }) => {
      const { id, ...rest } = payload;
      const { error } = await db
        .from("prises_en_charge")
        .update({ ...rest, decide_le: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires"] }),
  });
}

export function useSoumettreFacture() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      partenaire_id: string;
      prise_en_charge_id?: string | null;
      reference_partenaire?: string | null;
      periode?: string | null;
      montant_usd: number;
    }) => {
      const { data, error } = await db
        .from("factures_partenaires")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as FactureRow;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires", "factures"] }),
  });
}

export function useTraiterFacture() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      statut: StatutFacture;
      montant_valide_usd?: number | null;
      montant_paye_usd?: number;
      motif_rejet?: string | null;
    }) => {
      const { id, ...rest } = payload;
      const patch: Record<string, unknown> = { ...rest };
      if (payload.statut === "validee") patch["validee_le"] = new Date().toISOString();
      if (payload.statut === "payee") patch["payee_le"] = new Date().toISOString();
      const { error } = await db.from("factures_partenaires").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires", "factures"] }),
  });
}

export function useMarquerNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("partenaire_notifications")
        .update({ is_lue: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires", "notifications"] }),
  });
}

export function useRattacherCompte() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { partenaire_id: string; user_id: string; fonction?: string }) => {
      const { error } = await db.from("partenaire_membres").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires"] }),
  });
}

/** Vérification d'un adhérent via son QR : aucune donnée sensible retournée. */
export function useVerifierAdherent() {
  return useMutation({
    mutationFn: async (payload: { partenaire_id: string; token: string }) => {
      const { data, error } = await db.rpc("partenaire_verifier_adherent", {
        _partenaire_id: payload.partenaire_id,
        _token: payload.token,
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
  });
}

/** Extrait le token d'un contenu de QR (`/verify/{token}` ou token brut). */
export function extraireToken(value: string): string | null {
  const uuid = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuid ? uuid[0] : null;
}

export function useUploadDocumentPartenaire() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      partenaire_id: string;
      contrat_id?: string | null;
      type: string;
      file: File;
    }) => {
      const path = `partenaires/${payload.partenaire_id}/${Date.now()}-${payload.file.name}`;
      const { error: upErr } = await db.storage
        .from("medias")
        .upload(path, payload.file, { upsert: false });
      if (upErr) throw upErr;
      const { error } = await db.from("partenaire_documents").insert({
        partenaire_id: payload.partenaire_id,
        contrat_id: payload.contrat_id ?? null,
        type: payload.type,
        nom: payload.file.name,
        bucket: "medias",
        storage_path: path,
        mime_type: payload.file.type,
        taille_octets: payload.file.size,
      });
      if (error) throw error;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["partenaires", "documents"] }),
  });
}

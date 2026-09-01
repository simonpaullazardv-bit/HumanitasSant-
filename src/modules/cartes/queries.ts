/**
 * Accès aux données du module Cartes (adhérents, bénéficiaires et personnel).
 * Les règles métier — conditions d'impression, unicité de la carte active,
 * traçabilité des réimpressions, vérification du QR — sont appliquées en base.
 */
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TypeCarte = "adherent" | "beneficiaire" | "personnel";
export type StatutCarte = "active" | "remplacee" | "perdue" | "annulee" | "expiree";

export interface CarteRow {
  id: string;
  numero: string;
  qr_token: string;
  type_carte: TypeCarte;
  adherent_id: string | null;
  beneficiaire_id: string | null;
  personnel_id: string | null;
  categorie_id: string | null;
  statut: StatutCarte;
  motif: string | null;
  carte_precedente_id: string | null;
  paiement_id: string | null;
  date_emission: string;
  date_expiration: string | null;
  derniere_impression: string | null;
  nb_impressions: number;
  is_active: boolean;
  created_at: string;
}

export interface PersonnelRow {
  id: string;
  matricule: string;
  nom: string;
  postnom: string | null;
  prenom: string | null;
  sexe: string | null;
  fonction: string | null;
  departement: string | null;
  grade: string | null;
  email: string | null;
  telephone: string | null;
  photo_url: string | null;
  date_embauche: string | null;
  statut: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface ImpressionRow {
  id: string;
  carte_id: string;
  format: string;
  mode: string;
  motif: string | null;
  lot_id: string | null;
  imprime_par: string | null;
  created_at: string;
}

export interface ReimpressionRow {
  id: string;
  ancienne_carte_id: string;
  nouvelle_carte_id: string;
  motif: string;
  frais_usd: number;
  paiement_id: string | null;
  demande_par: string | null;
  created_at: string;
}

export interface ConditionsCarte {
  adhesion_validee: boolean;
  frais_carte_payes: boolean;
  infos_completes: boolean;
  champs_manquants: string[];
  imprimable: boolean;
  erreur?: string;
}

const anySupabase = {
  from: (table: string) => supabase.from(table as never),
  rpc: (fn: string, args?: Record<string, unknown>) =>
    supabase.rpc(fn as never, args as never) as Promise<{ data: unknown; error: unknown }>,
  storage: supabase.storage,
};

/* ------------------------------------------------------------------ */
/* Lectures                                                            */
/* ------------------------------------------------------------------ */

export const cartesQuery = (filters: { type?: TypeCarte; statut?: StatutCarte | "tous" } = {}) =>
  queryOptions({
    queryKey: ["cartes", "list", filters],
    queryFn: async (): Promise<CarteRow[]> => {
      let request = anySupabase
        .from("cartes_membre")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (filters.type) request = request.eq("type_carte", filters.type);
      if (filters.statut && filters.statut !== "tous")
        request = request.eq("statut", filters.statut);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as CarteRow[];
    },
  });

export const carteAdherentQuery = (adherentId: string | undefined) =>
  queryOptions({
    queryKey: ["cartes", "adherent", adherentId],
    enabled: Boolean(adherentId),
    queryFn: async (): Promise<CarteRow | null> => {
      const { data, error } = await anySupabase
        .from("cartes_membre")
        .select("*")
        .eq("adherent_id", adherentId!)
        .eq("statut", "active")
        .maybeSingle();
      if (error) throw error;
      return (data as CarteRow) ?? null;
    },
  });

export const conditionsCarteQuery = (adherentId: string | undefined) =>
  queryOptions({
    queryKey: ["cartes", "conditions", adherentId],
    enabled: Boolean(adherentId),
    queryFn: async (): Promise<ConditionsCarte> => {
      const { data, error } = await anySupabase.rpc("carte_conditions", {
        _adherent_id: adherentId!,
      });
      if (error) throw error;
      return data as ConditionsCarte;
    },
  });

export const personnelQuery = (search?: string) =>
  queryOptions({
    queryKey: ["cartes", "personnel", search ?? ""],
    queryFn: async (): Promise<PersonnelRow[]> => {
      let request = anySupabase.from("personnel").select("*").order("nom").limit(300);
      const term = search?.trim();
      if (term) {
        const like = `%${term}%`;
        request = request.or(
          `nom.ilike.${like},prenom.ilike.${like},matricule.ilike.${like},fonction.ilike.${like},departement.ilike.${like}`,
        );
      }
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as PersonnelRow[];
    },
  });

export const impressionsQuery = () =>
  queryOptions({
    queryKey: ["cartes", "impressions"],
    queryFn: async (): Promise<ImpressionRow[]> => {
      const { data, error } = await anySupabase
        .from("cartes_impressions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ImpressionRow[];
    },
  });

export const reimpressionsQuery = () =>
  queryOptions({
    queryKey: ["cartes", "reimpressions"],
    queryFn: async (): Promise<ReimpressionRow[]> => {
      const { data, error } = await anySupabase
        .from("cartes_reimpressions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ReimpressionRow[];
    },
  });

/* ------------------------------------------------------------------ */
/* Écritures                                                           */
/* ------------------------------------------------------------------ */

function useInvalidate() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ["cartes"] });
    void client.invalidateQueries({ queryKey: ["adherents"] });
  };
}

/** Émission ou réimpression : la base refuse si les conditions ne sont pas remplies. */
export function useEmettreCarte() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      adherentId?: string | null;
      beneficiaireId?: string | null;
      personnelId?: string | null;
      motif?: string | null;
      paiementId?: string | null;
    }) => {
      const { data, error } = input.beneficiaireId
        ? await anySupabase.rpc("emettre_carte_beneficiaire", {
            _beneficiaire_id: input.beneficiaireId,
            _motif: input.motif ?? null,
            _paiement_id: input.paiementId ?? null,
          })
        : await anySupabase.rpc("emettre_carte", {
            _adherent_id: input.adherentId ?? null,
            _personnel_id: input.personnelId ?? null,
            _motif: input.motif ?? null,
            _paiement_id: input.paiementId ?? null,
          });
      if (error) throw error;
      return data as string;
    },
    onSuccess: invalidate,
  });
}

/** Journalise une impression : le trigger serveur bloque toute carte non éligible. */
export function useEnregistrerImpression() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      carteIds: string[];
      format?: string;
      mode?: "individuelle" | "lot" | "reimpression";
      motif?: string | null;
      lotId?: string | null;
    }) => {
      const rows = input.carteIds.map((carte_id) => ({
        carte_id,
        format: input.format ?? "pdf",
        mode: input.mode ?? "individuelle",
        motif: input.motif ?? null,
        lot_id: input.lotId ?? null,
      }));
      const { error } = await anySupabase.from("cartes_impressions").insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useChangerStatutCarte() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      statut,
      motif,
    }: {
      id: string;
      statut: StatutCarte;
      motif?: string;
    }) => {
      const { error } = await anySupabase
        .from("cartes_membre")
        .update({ statut, is_active: statut === "active", motif: motif ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export type PersonnelInput = Partial<Omit<PersonnelRow, "id" | "created_at" | "matricule">> & {
  nom: string;
};

export function useSavePersonnel() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: PersonnelInput }) => {
      if (id) {
        const { error } = await anySupabase.from("personnel").update(values).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await anySupabase.from("personnel").insert(values);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Photos (bucket privé « medias », dossier photos/)                   */
/* ------------------------------------------------------------------ */

export async function uploadPhoto(prefix: string, blob: Blob): Promise<string> {
  const path = `photos/${prefix}/${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from("medias")
    .upload(path, blob, { contentType: "image/webp", upsert: true });
  if (error) throw error;
  return path;
}

/** URL signée d'une photo stockée (le bucket est privé). */
export const photoUrlQuery = (path: string | null | undefined) =>
  queryOptions({
    queryKey: ["cartes", "photo", path],
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      const value = path!;
      if (value.startsWith("http")) return value;
      const { data } = await supabase.storage.from("medias").createSignedUrl(value, 60 * 60);
      return data?.signedUrl ?? null;
    },
  });

/** Vérification publique d'une carte à partir du jeton du QR code. */
export const verificationQuery = (token: string) =>
  queryOptions({
    queryKey: ["verify", token],
    retry: false,
    queryFn: async (): Promise<Record<string, unknown>> => {
      const { data, error } = await anySupabase.rpc("verifier_carte", { _token: token });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
  });

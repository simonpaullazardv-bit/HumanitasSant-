/**
 * Accès aux données du module Adhérents & Bénéficiaires.
 * Toutes les requêtes passent par le client navigateur : les policies RLS
 * garantissent qu'un adhérent ne voit que son propre dossier.
 */
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LienParente, StatutAdherent, TypeAdhesion, TypeDocument } from "./constants";

export interface AdherentRow {
  id: string;
  matricule: string;
  user_id: string | null;
  nom: string;
  postnom: string | null;
  prenom: string | null;
  sexe: string | null;
  date_naissance: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  commune: string | null;
  ville: string;
  photo_url: string | null;
  categorie_id: string | null;
  entreprise_id: string | null;
  statut: StatutAdherent;
  type_adhesion: TypeAdhesion;
  date_adhesion: string;
  date_expiration: string | null;
  profession: string | null;
  etat_civil: string | null;
  nationalite: string | null;
  piece_type: string | null;
  piece_numero: string | null;
  contact_urgence_nom: string | null;
  contact_urgence_telephone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BeneficiaireRow {
  id: string;
  adherent_id: string;
  code: string | null;
  email: string | null;
  user_id: string | null;
  nom: string;
  prenom: string | null;
  lien: LienParente;
  date_naissance: string | null;
  sexe: string | null;
  telephone: string | null;
  photo_url: string | null;
  piece_type: string | null;
  piece_numero: string | null;
  notes: string | null;
  statut: StatutAdherent;
  is_active: boolean;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  adherent_id: string;
  beneficiaire_id: string | null;
  type: TypeDocument;
  nom: string;
  bucket: string;
  storage_path: string;
  notes: string | null;
  created_at: string;
}

export interface HistoriqueRow {
  id: string;
  adherent_id: string;
  beneficiaire_id: string | null;
  evenement: string;
  ancien_statut: string | null;
  nouveau_statut: string | null;
  created_at: string;
}

export interface AdherentFilters {
  search?: string;
  statut?: StatutAdherent | "tous";
  type?: TypeAdhesion | "tous";
}

/** Liste paginable des adhérents (filtrée par RLS selon le rôle). */
export const adherentsQuery = (filters: AdherentFilters) =>
  queryOptions({
    queryKey: ["adherents", "list", filters],
    queryFn: async (): Promise<AdherentRow[]> => {
      let request = supabase
        .from("adherents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.statut && filters.statut !== "tous") {
        request = request.eq("statut", filters.statut);
      }
      if (filters.type && filters.type !== "tous") {
        request = request.eq("type_adhesion", filters.type);
      }
      const term = filters.search?.trim();
      if (term) {
        const like = `%${term}%`;
        request = request.or(
          `nom.ilike.${like},postnom.ilike.${like},prenom.ilike.${like},matricule.ilike.${like},telephone.ilike.${like},email.ilike.${like}`,
        );
      }

      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as unknown as AdherentRow[];
    },
  });

export const adherentQuery = (id: string) =>
  queryOptions({
    queryKey: ["adherents", "detail", id],
    queryFn: async (): Promise<AdherentRow | null> => {
      const { data, error } = await supabase
        .from("adherents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as AdherentRow) ?? null;
    },
  });

/** Dossier de l'adhérent lié au compte connecté. */
export const monDossierQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["adherents", "mon-dossier", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<AdherentRow | null> => {
      const { data, error } = await supabase
        .from("adherents")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as AdherentRow) ?? null;
    },
  });

export const beneficiairesQuery = (adherentId: string) =>
  queryOptions({
    queryKey: ["adherents", "beneficiaires", adherentId],
    queryFn: async (): Promise<BeneficiaireRow[]> => {
      const { data, error } = await supabase
        .from("beneficiaires")
        .select("*")
        .eq("adherent_id", adherentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BeneficiaireRow[];
    },
  });

export const documentsQuery = (adherentId: string) =>
  queryOptions({
    queryKey: ["adherents", "documents", adherentId],
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from("adherent_documents")
        .select("*")
        .eq("adherent_id", adherentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
    },
  });

export const historiqueQuery = (adherentId: string) =>
  queryOptions({
    queryKey: ["adherents", "historique", adherentId],
    queryFn: async (): Promise<HistoriqueRow[]> => {
      const { data, error } = await supabase
        .from("adherent_historique")
        .select("*")
        .eq("adherent_id", adherentId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as HistoriqueRow[];
    },
  });

export const dossierFinanceQuery = (adherentId: string) =>
  queryOptions({
    queryKey: ["adherents", "finance", adherentId],
    queryFn: async () => {
      const [carte, cotisations, paiements, adhesions] = await Promise.all([
        supabase.from("cartes_membre").select("*").eq("adherent_id", adherentId).maybeSingle(),
        supabase
          .from("cotisations")
          .select("*")
          .eq("adherent_id", adherentId)
          .order("periode", { ascending: false }),
        supabase
          .from("paiements")
          .select("*")
          .eq("adherent_id", adherentId)
          .order("date_paiement", { ascending: false }),
        supabase
          .from("adhesions")
          .select("*")
          .eq("adherent_id", adherentId)
          .order("date_debut", { ascending: false }),
      ]);
      return {
        carte: carte.data,
        cotisations: cotisations.data ?? [],
        paiements: paiements.data ?? [],
        adhesions: adhesions.data ?? [],
      };
    },
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["adherents", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories_adhesion")
        .select("id, code, nom, prix_usd")
        .eq("is_active", true)
        .order("ordre");
      if (error) throw error;
      return data ?? [];
    },
  });

export const entreprisesQuery = () =>
  queryOptions({
    queryKey: ["adherents", "entreprises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partenaires")
        .select("id, nom")
        .eq("type", "entreprise")
        .eq("is_active", true)
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

/** Invalide toutes les vues du dossier après une écriture. */
function useInvalidate() {
  const client = useQueryClient();
  return (adherentId?: string) => {
    void client.invalidateQueries({ queryKey: ["adherents"] });
    if (adherentId) {
      void client.invalidateQueries({ queryKey: ["adherents", "detail", adherentId] });
    }
  };
}

export type AdherentInput = Partial<
  Omit<AdherentRow, "id" | "matricule" | "created_at" | "updated_at">
> & {
  nom: string;
  ville: string;
};

export function useSaveAdherent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: AdherentInput }) => {
      if (id) {
        const { data, error } = await supabase
          .from("adherents")
          .update(values as never)
          .eq("id", id)
          .select("*")
          .single();
        if (error) throw error;
        return data as unknown as AdherentRow;
      }
      const { data, error } = await supabase
        .from("adherents")
        .insert(values as never)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as AdherentRow;
    },
    onSuccess: (row) => invalidate(row.id),
  });
}

export function useChangeStatut() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      table,
      id,
      statut,
    }: {
      table: "adherents" | "beneficiaires";
      id: string;
      statut: StatutAdherent;
    }) => {
      const payload =
        table === "beneficiaires" ? { statut, is_active: statut === "actif" } : { statut };
      const { error } = await supabase
        .from(table)
        .update(payload as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
}

export type BeneficiaireInput = Partial<Omit<BeneficiaireRow, "id" | "created_at">> & {
  adherent_id: string;
  nom: string;
  lien: LienParente;
};

export function useSaveBeneficiaire() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: BeneficiaireInput }) => {
      if (id) {
        const { error } = await supabase
          .from("beneficiaires")
          .update(values as never)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("beneficiaires").insert(values as never);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
}

export function useAddDocument() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (values: {
      adherent_id: string;
      beneficiaire_id?: string | null;
      type: TypeDocument;
      nom: string;
      storage_path: string;
      notes?: string | null;
    }) => {
      const { error } = await supabase.from("adherent_documents").insert(values as never);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
}

export function useDeleteDocument() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("adherent_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
}

/** Téléverse un fichier dans le bucket privé `medias`. */
export async function uploadDossierFile(adherentId: string, file: File): Promise<string> {
  const path = `adherents/${adherentId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const { error } = await supabase.storage.from("medias").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

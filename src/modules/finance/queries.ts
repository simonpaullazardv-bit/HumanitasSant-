/**
 * Accès aux données Cotisations & Paiements.
 * Les règles métier (répartition 70/30, échéance du 5, carence de 3 mensualités,
 * unicité de la période, immutabilité du grand livre) sont appliquées par la base :
 * le client ne fait que lire les paramètres et déclencher les opérations.
 */
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StatutCotisation, StatutPaiement, TypeOperation } from "./constants";

export interface CategorieRow {
  id: string;
  code: string;
  nom: string;
  prix_usd: number;
  devise: string;
  periode: string;
  taux_couverture: number;
  plafond_usd: number | null;
  prestations_autorisees: string[];
  conditions: Record<string, unknown>;
  avantages: string[];
  ordre: number;
  is_active: boolean;
}

export interface ModePaiementRow {
  code: string;
  libelle: string;
  description: string | null;
  exige_reference: boolean;
  is_active: boolean;
}

export interface CotisationRow {
  id: string;
  adherent_id: string;
  categorie_id: string | null;
  periode: string;
  echeance: string;
  montant_usd: number;
  montant_paye: number;
  devise: string;
  statut: StatutCotisation;
  created_at: string;
}

export interface PaiementRow {
  id: string;
  adherent_id: string;
  cotisation_id: string | null;
  reference: string;
  montant_usd: number;
  devise: string;
  mode: string;
  payeur: string | null;
  periode: string | null;
  type_operation: TypeOperation;
  statut: StatutPaiement;
  preuve_bucket: string | null;
  preuve_path: string | null;
  notes: string | null;
  date_paiement: string;
}

export interface SoldeRow {
  adherent_id: string;
  total_du: number;
  total_paye: number;
  solde: number;
  mensualites_validees: number;
  droits_ouverts: boolean;
  updated_at: string;
}

export interface OperationRow {
  id: string;
  adherent_id: string | null;
  paiement_id: string | null;
  type_operation: string;
  affectation: "fonds_mutuelle" | "administration";
  montant_usd: number;
  devise: string;
  libelle: string | null;
  periode: string | null;
  created_at: string;
}

export interface AlerteRow {
  id: string;
  adherent_id: string;
  cotisation_id: string | null;
  type: string;
  niveau: "info" | "avertissement" | "critique";
  message: string;
  is_traite: boolean;
  created_at: string;
}

/** Catégories tarifaires : source unique de vérité pour les prix et couvertures. */
export const categoriesFinanceQuery = () =>
  queryOptions({
    queryKey: ["finance", "categories"],
    queryFn: async (): Promise<CategorieRow[]> => {
      const { data, error } = await supabase
        .from("categories_adhesion")
        .select("*")
        .eq("is_active", true)
        .order("ordre");
      if (error) throw error;
      return (data ?? []) as unknown as CategorieRow[];
    },
  });

/** Modes de paiement : ajoutables via les paramètres, jamais codés en dur. */
export const modesPaiementQuery = () =>
  queryOptions({
    queryKey: ["finance", "modes"],
    queryFn: async (): Promise<ModePaiementRow[]> => {
      const { data, error } = await supabase
        .from("modes_paiement")
        .select("*")
        .eq("is_active", true)
        .order("ordre");
      if (error) throw error;
      return (data ?? []) as unknown as ModePaiementRow[];
    },
  });

export interface ParametresFinance {
  jourEcheance: number;
  mensualitesCarence: number;
  devise: string;
  repartitionCotisation: { fonds_mutuelle: number; administration: number };
  repartitionFraisCarte: { fonds_mutuelle: number; administration: number };
}

export const parametresFinanceQuery = () =>
  queryOptions({
    queryKey: ["finance", "parametres"],
    queryFn: async (): Promise<ParametresFinance> => {
      const { data, error } = await supabase
        .from("app_parametres")
        .select("cle, valeur")
        .eq("categorie", "finance");
      if (error) throw error;
      const map = new Map((data ?? []).map((row) => [row.cle, row.valeur as unknown]));
      const repartition = (key: string, fallback: ParametresFinance["repartitionCotisation"]) =>
        (map.get(key) as ParametresFinance["repartitionCotisation"] | undefined) ?? fallback;
      return {
        jourEcheance: Number(map.get("finance.jour_echeance") ?? 5),
        mensualitesCarence: Number(map.get("finance.mensualites_carence") ?? 3),
        devise: String(map.get("finance.devise") ?? "USD"),
        repartitionCotisation: repartition("finance.repartition_cotisation", {
          fonds_mutuelle: 70,
          administration: 30,
        }),
        repartitionFraisCarte: repartition("finance.repartition_frais_carte", {
          fonds_mutuelle: 0,
          administration: 100,
        }),
      };
    },
  });

export interface CotisationFilters {
  statut?: StatutCotisation | "tous";
  periode?: string | "toutes";
  adherentId?: string;
}

export const cotisationsQuery = (filters: CotisationFilters) =>
  queryOptions({
    queryKey: ["finance", "cotisations", filters],
    queryFn: async (): Promise<CotisationRow[]> => {
      let request = supabase
        .from("cotisations")
        .select("*")
        .order("periode", { ascending: false })
        .limit(300);
      if (filters.statut && filters.statut !== "tous")
        request = request.eq("statut", filters.statut);
      if (filters.periode && filters.periode !== "toutes")
        request = request.eq("periode", filters.periode);
      if (filters.adherentId) request = request.eq("adherent_id", filters.adherentId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as unknown as CotisationRow[];
    },
  });

export const paiementsQuery = (adherentId?: string) =>
  queryOptions({
    queryKey: ["finance", "paiements", adherentId ?? "tous"],
    queryFn: async (): Promise<PaiementRow[]> => {
      let request = supabase
        .from("paiements")
        .select("*")
        .order("date_paiement", { ascending: false })
        .limit(300);
      if (adherentId) request = request.eq("adherent_id", adherentId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as unknown as PaiementRow[];
    },
  });

export const soldeQuery = (adherentId: string | undefined) =>
  queryOptions({
    queryKey: ["finance", "solde", adherentId],
    enabled: Boolean(adherentId),
    queryFn: async (): Promise<SoldeRow | null> => {
      const { data, error } = await supabase
        .from("soldes_adherents")
        .select("*")
        .eq("adherent_id", adherentId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as SoldeRow) ?? null;
    },
  });

export const operationsQuery = (adherentId?: string) =>
  queryOptions({
    queryKey: ["finance", "operations", adherentId ?? "tous"],
    queryFn: async (): Promise<OperationRow[]> => {
      let request = supabase
        .from("operations_financieres")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (adherentId) request = request.eq("adherent_id", adherentId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as unknown as OperationRow[];
    },
  });

export const alertesQuery = (adherentId?: string) =>
  queryOptions({
    queryKey: ["finance", "alertes", adherentId ?? "tous"],
    queryFn: async (): Promise<AlerteRow[]> => {
      let request = supabase
        .from("alertes_financieres")
        .select("*")
        .eq("is_traite", false)
        .order("created_at", { ascending: false })
        .limit(100);
      if (adherentId) request = request.eq("adherent_id", adherentId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as unknown as AlerteRow[];
    },
  });

export interface JournalCaisseRow {
  id: string;
  date_operation: string;
  numero_piece: string;
  type_operation: string;
  sens: "debit" | "credit";
  montant_usd: number;
  montant_admin_usd: number;
  montant_soins_usd: number;
  mode_paiement: string;
  reference_transaction: string;
  affectation: string;
  libelle: string | null;
  tiers_nom: string;
  operateur_id: string | null;
}

export interface GrandLivreRow {
  id: string;
  date_écriture: string;
  compte_code: string;
  compte_libelle: string;
  type_operation: string;
  libelle: string | null;
  debit_usd: number;
  credit_usd: number;
  montant_admin_usd: number;
  montant_soins_usd: number;
}

export interface BalanceComptableRow {
  compte: string;
  nombre_écritures: number;
  total_credit_usd: number;
  total_debit_usd: number;
  solde_net_usd: number;
  sous_total_frais_admin_usd: number;
  sous_total_fonds_soins_usd: number;
}

export const journalCaisseQuery = () =>
  queryOptions({
    queryKey: ["finance", "journal_caisse"],
    queryFn: async (): Promise<JournalCaisseRow[]> => {
      const { data, error } = await supabase.rpc("get_journal_caisse" as never);
      if (error) throw error;
      return (data ?? []) as unknown as JournalCaisseRow[];
    },
  });

export const grandLivreQuery = () =>
  queryOptions({
    queryKey: ["finance", "grand_livre"],
    queryFn: async (): Promise<GrandLivreRow[]> => {
      const { data, error } = await supabase.rpc("get_grand_livre" as never);
      if (error) throw error;
      return (data ?? []) as unknown as GrandLivreRow[];
    },
  });

export const balanceComptableQuery = () =>
  queryOptions({
    queryKey: ["finance", "balance_comptable"],
    queryFn: async (): Promise<BalanceComptableRow[]> => {
      const { data, error } = await supabase.rpc("get_balance_comptable" as never);
      if (error) throw error;
      return (data ?? []) as unknown as BalanceComptableRow[];
    },
  });

function useInvalidateFinance() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ["finance"] });
    void client.invalidateQueries({ queryKey: ["adherents"] });
  };
}

/** Appel de cotisation : l'échéance et la période sont normalisées par la base. */
export function useCreerCotisation() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (values: {
      adherent_id: string;
      categorie_id: string | null;
      periode: string;
      montant_usd: number;
      devise: string;
    }) => {
      const { error } = await supabase.from("cotisations").insert({
        adherent_id: values.adherent_id,
        categorie_id: values.categorie_id,
        periode: values.periode,
        montant_usd: values.montant_usd,
        devise: values.devise,
        echeance: values.periode,
      } as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/**
 * Enregistrement d'un paiement : la base génère la référence si absente,
 * refuse un doublon de période, répartit le montant et recalcule le solde.
 */
export function useEnregistrerPaiement() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (values: {
      adherent_id: string;
      cotisation_id?: string | null;
      montant_usd: number;
      devise: string;
      mode: string;
      reference?: string | null;
      payeur?: string | null;
      periode?: string | null;
      type_operation: TypeOperation;
      statut: StatutPaiement;
      preuve_path?: string | null;
      notes?: string | null;
    }) => {
      const { error } = await supabase.from("paiements").insert({
        ...values,
        reference: values.reference?.trim() || null,
        preuve_bucket: values.preuve_path ? "medias" : null,
      } as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Passage en retard des échéances dépassées (statut, alerte, historique). */
export function useTraiterRetards() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("traiter_retards");
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: invalidate,
  });
}

/** Téléverse une preuve de paiement dans le bucket privé `medias`. */
export async function uploadPreuve(adherentId: string, file: File): Promise<string> {
  const path = `paiements/${adherentId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const { error } = await supabase.storage.from("medias").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

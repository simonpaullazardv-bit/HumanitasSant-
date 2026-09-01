/**
 * Circuit de prise en charge (étapes 1 à 12).
 * Toutes les décisions passent par des fonctions serveur atomiques :
 * la double validation et le double remboursement sont bloqués en base.
 */
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = {
  from: (table: string) => supabase.from(table as never),
  rpc: (fn: string, args?: Record<string, unknown>) =>
    supabase.rpc(fn as never, args as never) as Promise<{ data: unknown; error: unknown }>,
};

export type TypePrestation =
  "symptome" | "consultation" | "acte" | "examen" | "medicament" | "hospitalisation" | "autre";

export const TYPES_PRESTATION: { value: TypePrestation; label: string }[] = [
  { value: "symptome", label: "Symptôme" },
  { value: "consultation", label: "Consultation" },
  { value: "acte", label: "Acte" },
  { value: "examen", label: "Examen" },
  { value: "medicament", label: "Médicament" },
  { value: "hospitalisation", label: "Hospitalisation" },
  { value: "autre", label: "Autre prestation" },
];

export type StatutOrdre = "en_attente" | "valide" | "rejete" | "paye";

export const STATUT_ORDRE_LABELS: Record<StatutOrdre, string> = {
  en_attente: "À valider (administration)",
  valide: "Autorisé — à payer",
  rejete: "Rejeté",
  paye: "Payé",
};

export interface EligibiliteResult {
  eligible: boolean;
  motifs?: string[];
  adherent_id?: string;
  beneficiaire_id?: string;
  type_personne?: "adherent" | "beneficiaire";
  code?: string;
  matricule?: string;
  titulaire?: string;
  photo_url?: string | null;
  lien?: string;
  statut?: string;
  etat_couverture?: string;
  statut_adherent?: string;
  carte?: { id: string; numero: string; statut: string; date_expiration: string | null };
  categorie?: {
    id: string | null;
    nom: string | null;
    taux_couverture: number | null;
    prestations_autorisees: unknown;
  };
  cotisations?: { mensualites_validees: number; droits_ouverts: boolean };
  plafond?: {
    plafond_annuel_usd: number | null;
    consomme_usd: number;
    engage_usd: number;
    disponible_usd: number | null;
  };
  contrat?: {
    id: string;
    numero: string;
    date_fin: string | null;
    taux_couverture: number;
    prestations_autorisees: unknown;
    plafond_acte_usd: number | null;
  };
  exclusions?: unknown;
  conditions_particulieres?: Record<string, unknown>;
  verifie_le?: string;
}

export interface DecisionRow {
  id: string;
  prise_en_charge_id: string;
  decision: string;
  ancien_statut: string | null;
  nouveau_statut: string | null;
  motif: string | null;
  montant_approuve_usd: number | null;
  created_at: string;
}

export interface PrestationRow {
  id: string;
  prise_en_charge_id: string;
  type: TypePrestation;
  libelle: string;
  quantite: number;
  montant_unitaire_usd: number;
  montant_usd: number;
  notes: string | null;
  created_at: string;
}

export interface OrdreRow {
  id: string;
  numero: string;
  facture_id: string;
  partenaire_id: string;
  prise_en_charge_id: string | null;
  adherent_id: string | null;
  montant_usd: number;
  statut: StatutOrdre;
  avis_medical: string | null;
  motif_rejet: string | null;
  mode_paiement: string | null;
  reference_paiement: string | null;
  controle_le: string | null;
  valide_le: string | null;
  paye_le: string | null;
  created_at: string;
}

export interface NotificationInterneRow {
  id: string;
  destinataire_role: string;
  titre: string;
  message: string;
  niveau: string;
  entite: string | null;
  entite_id: string | null;
  lien: string | null;
  is_lue: boolean;
  created_at: string;
}

/* ----------------------------- Lectures ----------------------------- */

export const decisionsQuery = (pecId: string | undefined) =>
  queryOptions({
    queryKey: ["pec", "decisions", pecId],
    enabled: Boolean(pecId),
    queryFn: async (): Promise<DecisionRow[]> => {
      const { data, error } = await db
        .from("pec_decisions")
        .select("*")
        .eq("prise_en_charge_id", pecId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DecisionRow[];
    },
  });

export const prestationsQuery = (pecId: string | undefined) =>
  queryOptions({
    queryKey: ["pec", "prestations", pecId],
    enabled: Boolean(pecId),
    queryFn: async (): Promise<PrestationRow[]> => {
      const { data, error } = await db
        .from("pec_prestations")
        .select("*")
        .eq("prise_en_charge_id", pecId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PrestationRow[];
    },
  });

export const ordresQuery = (filters: { statut?: StatutOrdre | "tous" } = {}) =>
  queryOptions({
    queryKey: ["pec", "ordres", filters],
    queryFn: async (): Promise<OrdreRow[]> => {
      let request = db
        .from("ordres_remboursement")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (filters.statut && filters.statut !== "tous")
        request = request.eq("statut", filters.statut);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as OrdreRow[];
    },
  });

export const notificationsInternesQuery = () =>
  queryOptions({
    queryKey: ["pec", "notifications-internes"],
    queryFn: async (): Promise<NotificationInterneRow[]> => {
      const { data, error } = await db
        .from("notifications_internes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as NotificationInterneRow[];
    },
  });

export const plafondQuery = (adherentId: string | undefined) =>
  queryOptions({
    queryKey: ["pec", "plafond", adherentId],
    enabled: Boolean(adherentId),
    queryFn: async () => {
      const { data, error } = await db.rpc("plafond_disponible", { _adherent_id: adherentId! });
      if (error) throw error;
      return data as EligibiliteResult["plafond"];
    },
  });

/* ----------------------------- Écritures ---------------------------- */

/** Étapes 2 et 3 : vérification complète par QR code ou numéro Humanitas. */
export function useVerifierEligibilite() {
  return useMutation({
    mutationFn: async (payload: {
      partenaire_id: string;
      token?: string | null;
      matricule?: string | null;
    }) => {
      const { data, error } = await db.rpc("partenaire_verifier_code", {
        _partenaire_id: payload.partenaire_id,
        _code: payload.matricule ?? null,
        _token: payload.token ?? null,
      });
      if (error) throw error;
      return data as EligibiliteResult;
    },
  });
}

/** Étape 6 : décision du médecin conseil, systématiquement historisée. */
export function useDecisionMedicale() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      pec_id: string;
      decision: "validee" | "refusee" | "info_requise" | "mise_en_revue";
      motif?: string | null;
      montant?: number | null;
    }) => {
      const { data, error } = await db.rpc("pec_decider", {
        _pec_id: payload.pec_id,
        _decision: payload.decision,
        _motif: payload.motif ?? null,
        _montant: payload.montant ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["pec"] });
      void client.invalidateQueries({ queryKey: ["partenaires"] });
    },
  });
}

/** Étape 7 : prestations réalisées (minimum d'informations nécessaires). */
export function useEnregistrerPrestations() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      pec_id: string;
      prestations: {
        type: TypePrestation;
        libelle: string;
        quantite: number;
        montant_unitaire_usd: number;
        notes?: string | null;
      }[];
    }) => {
      const { data, error } = await db.rpc("pec_enregistrer_prestations", {
        _pec_id: payload.pec_id,
        _prestations: payload.prestations,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["pec"] });
      void client.invalidateQueries({ queryKey: ["partenaires"] });
    },
  });
}

/** Étape 9 : contrôle médical de la facture, création de l'ordre de remboursement. */
export function useControlerFacture() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      facture_id: string;
      decision: "validee" | "rejetee";
      montant_valide?: number | null;
      avis?: string | null;
    }) => {
      const { data, error } = await db.rpc("facture_controler", {
        _facture_id: payload.facture_id,
        _decision: payload.decision,
        _montant_valide: payload.montant_valide ?? null,
        _avis: payload.avis ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["pec"] });
      void client.invalidateQueries({ queryKey: ["partenaires"] });
    },
  });
}

/** Étape 10 : autorisation administrative de l'ordre. */
export function useValiderOrdre() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ordre_id: string;
      decision: "valide" | "rejete";
      motif?: string;
    }) => {
      const { data, error } = await db.rpc("ordre_valider", {
        _ordre_id: payload.ordre_id,
        _decision: payload.decision,
        _motif: payload.motif ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["pec"] }),
  });
}

/** Étapes 11 et 12 : paiement atomique, écritures et notifications. */
export function usePayerOrdre() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ordre_id: string; mode: string; reference?: string | null }) => {
      const { data, error } = await db.rpc("ordre_payer", {
        _ordre_id: payload.ordre_id,
        _mode: payload.mode,
        _reference: payload.reference || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["pec"] });
      void client.invalidateQueries({ queryKey: ["partenaires"] });
    },
  });
}

export function useMarquerNotificationInterne() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("notifications_internes")
        .update({ is_lue: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["pec", "notifications-internes"] }),
  });
}

/**
 * Référentiels d'affichage du module Cotisations & Paiements.
 * Aucune valeur métier (tarif, couverture, répartition, échéance, carence)
 * n'est codée ici : tout provient de `categories_adhesion`, `modes_paiement`
 * et `app_parametres`.
 */

export type StatutCotisation = "due" | "partielle" | "payee" | "en_retard" | "annulee";
export type StatutPaiement = "en_attente" | "valide" | "rejete" | "annule";
export type TypeOperation = "cotisation" | "frais_carte" | "autre";
export type Affectation = "fonds_mutuelle" | "administration";

export const STATUTS_COTISATION: readonly StatutCotisation[] = [
  "due",
  "partielle",
  "payee",
  "en_retard",
  "annulee",
] as const;

export const STATUT_COTISATION_LABELS: Record<StatutCotisation, string> = {
  due: "Due",
  partielle: "Partielle",
  payee: "Payée",
  en_retard: "En retard",
  annulee: "Annulée",
};

export const STATUT_COTISATION_BADGE: Record<StatutCotisation, string> = {
  due: "bg-muted text-muted-foreground",
  partielle: "bg-primary/10 text-primary",
  payee: "bg-accent/15 text-accent",
  en_retard: "bg-destructive/10 text-destructive",
  annulee: "bg-foreground/10 text-foreground",
};

export const STATUT_PAIEMENT_LABELS: Record<StatutPaiement, string> = {
  en_attente: "En attente",
  valide: "Validé",
  rejete: "Rejeté",
  annule: "Annulé",
};

export const STATUT_PAIEMENT_BADGE: Record<StatutPaiement, string> = {
  en_attente: "bg-muted text-muted-foreground",
  valide: "bg-accent/15 text-accent",
  rejete: "bg-destructive/10 text-destructive",
  annule: "bg-foreground/10 text-foreground",
};

export const TYPE_OPERATION_LABELS: Record<TypeOperation, string> = {
  cotisation: "Cotisation",
  frais_carte: "Frais de carte",
  autre: "Autre",
};

export const AFFECTATION_LABELS: Record<Affectation, string> = {
  fonds_mutuelle: "Fonds Mutuelle",
  administration: "Administration",
};

export function formatMontant(value: number | string | null | undefined, devise = "USD"): string {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
}

export function formatPeriode(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** Mois courant au format `YYYY-MM-01`, utilisé pour proposer une période. */
export function moisCourant(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Douze périodes glissantes (mois courant en tête) pour les sélecteurs. */
export function periodesDisponibles(count = 12): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
  });
}

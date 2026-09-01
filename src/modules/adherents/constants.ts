/**
 * Référentiels du module Adhérents & Bénéficiaires.
 * Les mêmes règles (statuts, transitions, limite de 4 bénéficiaires)
 * sont appliquées côté base par des triggers : l'interface ne fait que les refléter.
 */

export type StatutAdherent =
  "en_attente" | "actif" | "suspendu" | "inactif" | "expire" | "resilie" | "decede";

export type TypeAdhesion = "individuel" | "familial" | "collectif";

export type LienParente = "conjoint" | "enfant" | "parent" | "autre";

export type TypeDocument =
  | "piece_identite"
  | "photo"
  | "justificatif_domicile"
  | "acte_naissance"
  | "contrat"
  | "certificat_medical"
  | "autre";

export const STATUTS: readonly StatutAdherent[] = [
  "en_attente",
  "actif",
  "suspendu",
  "inactif",
  "expire",
  "resilie",
  "decede",
] as const;

export const STATUT_LABELS: Record<StatutAdherent, string> = {
  en_attente: "En attente",
  actif: "Actif",
  suspendu: "Suspendu",
  inactif: "Inactif",
  expire: "Expiré",
  resilie: "Résilié",
  decede: "Décédé",
};

/** Classes de badge par statut (tokens sémantiques du design system). */
export const STATUT_BADGE: Record<StatutAdherent, string> = {
  en_attente: "bg-muted text-muted-foreground",
  actif: "bg-accent/15 text-accent",
  suspendu: "bg-destructive/10 text-destructive",
  inactif: "bg-muted text-muted-foreground",
  expire: "bg-destructive/10 text-destructive",
  resilie: "bg-destructive/15 text-destructive",
  decede: "bg-foreground/10 text-foreground",
};

/** Transitions autorisées — miroir exact du trigger `check_statut_transition`. */
export const STATUT_TRANSITIONS: Record<StatutAdherent, readonly StatutAdherent[]> = {
  en_attente: ["actif", "inactif", "resilie", "decede"],
  actif: ["suspendu", "expire", "resilie", "inactif", "decede"],
  suspendu: ["actif", "resilie", "expire", "inactif", "decede"],
  expire: ["actif", "resilie", "inactif", "decede"],
  inactif: ["actif", "resilie", "decede"],
  resilie: ["actif", "decede"],
  decede: [],
};

export const TYPE_ADHESION_LABELS: Record<TypeAdhesion, string> = {
  individuel: "Individuel",
  familial: "Familial",
  collectif: "Collectif (entreprise)",
};

export const LIEN_LABELS: Record<LienParente, string> = {
  conjoint: "Conjoint(e)",
  enfant: "Enfant",
  parent: "Parent",
  autre: "Autre",
};

export const DOCUMENT_LABELS: Record<TypeDocument, string> = {
  piece_identite: "Pièce d'identité",
  photo: "Photo",
  justificatif_domicile: "Justificatif de domicile",
  acte_naissance: "Acte de naissance",
  contrat: "Contrat",
  certificat_medical: "Certificat médical",
  autre: "Autre document",
};

/** Nombre maximum de bénéficiaires actifs par adhérent (règle RM001). */
export const MAX_BENEFICIAIRES = 4;

export function fullName(person: {
  nom: string;
  postnom?: string | null;
  prenom?: string | null;
}): string {
  return [person.prenom, person.nom, person.postnom].filter(Boolean).join(" ");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

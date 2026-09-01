/**
 * Référentiel central des rôles applicatifs.
 * Toute logique d'autorisation côté interface passe par ces constantes.
 * L'autorisation réelle est appliquée en base par les policies RLS.
 */
import type { UserRole } from "@/types";

export const APP_ROLES: readonly UserRole[] = [
  "super_admin",
  "administrateur",
  "directeur_general",
  "coordonnateur",
  "medecin_conseil",
  "financier",
  "agent_humanitas",
  "entreprise",
  "hopital",
  "pharmacie",
  "laboratoire",
  "centre_bien_etre",
  "adherent",
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Administrateur",
  administrateur: "Administrateur",
  directeur_general: "Directeur Général",
  coordonnateur: "Coordonnateur",
  medecin_conseil: "Médecin Conseil",
  financier: "Financier",
  agent_humanitas: "Agent Humanitas",
  entreprise: "Entreprise partenaire",
  hopital: "Hôpital partenaire",
  pharmacie: "Pharmacie partenaire",
  laboratoire: "Laboratoire partenaire",
  centre_bien_etre: "Centre de bien-être partenaire",
  adherent: "Adhérent",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: "Contrôle total : utilisateurs, rôles, configuration et audit.",
  administrateur: "Pilotage de la mutuelle, contenus et référentiels.",
  directeur_general: "Pilotage stratégique, gouvernance, performance et décisions de Direction Générale.",
  coordonnateur: "Suivi des adhésions, des dossiers et du réseau de soins.",
  medecin_conseil: "Validation médicale des prises en charge et prestations.",
  financier: "Cotisations, encaissements, facturation et reporting financier.",
  agent_humanitas: "Terrain : enrôlement des adhérents et accompagnement.",
  entreprise: "Suivi des collaborateurs couverts par un contrat collectif.",
  hopital: "Vérification des droits et transmission des actes.",
  pharmacie: "Vérification des droits et prestations pharmaceutiques autorisées.",
  laboratoire: "Vérification des droits et prestations de laboratoire autorisées.",
  centre_bien_etre: "Vérification des droits et prestations de bien-être autorisées.",
  adherent: "Espace personnel : carte, cotisations, bénéficiaires.",
};

/** Route du tableau de bord par défaut de chaque rôle. */
export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/portail/administration",
  directeur_general: "/portail/direction-generale",
  administrateur: "/portail/administration",
  coordonnateur: "/portail/coordination",
  medecin_conseil: "/portail/medical",
  financier: "/portail/finance",
  agent_humanitas: "/portail/agent",
  entreprise: "/portail/entreprise",
  hopital: "/portail/hopital",
  pharmacie: "/portail/pharmacie",
  laboratoire: "/portail/laboratoire",
  centre_bien_etre: "/portail/centre-bien-etre",
  adherent: "/portail/adherent",
};

/** Ordre de priorité lorsqu'un utilisateur cumule plusieurs rôles. */
export const ROLE_PRIORITY: readonly UserRole[] = [
  "super_admin",
  "administrateur",
  "directeur_general",
  "coordonnateur",
  "medecin_conseil",
  "financier",
  "agent_humanitas",
  "entreprise",
  "hopital",
  "pharmacie",
  "laboratoire",
  "centre_bien_etre",
  "adherent",
] as const;

export const STAFF_ROLES: readonly UserRole[] = [
  "super_admin",
  "administrateur",
  "directeur_general",
  "coordonnateur",
  "medecin_conseil",
  "financier",
  "agent_humanitas",
] as const;

export const ADMIN_ROLES: readonly UserRole[] = ["super_admin", "administrateur"] as const;

/** Retourne le rôle principal d'un utilisateur selon l'ordre de priorité. */
export function primaryRole(roles: readonly UserRole[]): UserRole | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

/** Retourne la route d'accueil du portail pour un ensemble de rôles. */
export function homeForRoles(roles: readonly UserRole[]): string {
  const role = primaryRole(roles);
  return role ? ROLE_HOME[role] : "/portail/adherent";
}

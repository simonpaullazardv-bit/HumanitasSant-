/**
 * Navigation publique du site institutionnel.
 * Structure en groupes pour le méga-menu de l'en-tête et les colonnes du pied de page.
 */
import type { FileRouteTypes } from "@/routeTree.gen";

type Path = FileRouteTypes["to"];

export interface NavItem {
  to: Path;
  label: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_HOME: NavItem = { to: "/", label: "Accueil" };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Institution",
    items: [
      { to: "/a-propos", label: "À propos", description: "Notre histoire et notre organisation" },
      { to: "/vision", label: "Vision", description: "Ce que nous construisons" },
      { to: "/mission", label: "Mission", description: "Notre raison d'être" },
      { to: "/valeurs", label: "Valeurs", description: "Ce qui guide nos décisions" },
      { to: "/equipe", label: "Notre équipe", description: "Direction et coordination" },
    ],
  },
  {
    label: "Nos offres",
    items: [
      { to: "/services", label: "Nos services", description: "Mutuelle et centre de bien-être" },
      { to: "/tarifs", label: "Catégories & tarifs", description: "Bronze, Argent, Or, Platine" },
      { to: "/comment-adherer", label: "Comment adhérer", description: "Les étapes de l'adhésion" },
      {
        to: "/adhesion",
        label: "Formulaire d'adhésion",
        description: "Déposer sa demande en ligne",
      },
    ],
  },
  {
    label: "Réseau",
    items: [
      { to: "/partenaires", label: "Tous les partenaires", description: "Le réseau conventionné" },
      { to: "/partenaires/hopitaux", label: "Hôpitaux", description: "Structures de soins" },
      {
        to: "/partenaires/pharmacies",
        label: "Pharmacies",
        description: "Officines conventionnées",
      },
      { to: "/partenaires/laboratoires", label: "Laboratoires", description: "Analyses médicales" },
      { to: "/partenariat", label: "Devenir partenaire", description: "Rejoindre le réseau" },
    ],
  },
  {
    label: "Médias",
    items: [
      { to: "/actualites", label: "Actualités", description: "Communiqués et campagnes" },
      { to: "/evenements", label: "Évènements", description: "Nos rendez-vous" },
      { to: "/realisations", label: "Réalisations", description: "Nos actions sur le terrain" },
      { to: "/galerie", label: "Médiathèque", description: "Photos et vidéos" },
      { to: "/telechargements", label: "Téléchargements", description: "Documents officiels" },
    ],
  },
  {
    label: "Aide",
    items: [
      { to: "/faq", label: "FAQ", description: "Questions fréquentes" },
      { to: "/recrutement", label: "Recrutement", description: "Nous rejoindre" },
      { to: "/contact", label: "Contact", description: "Nous écrire ou nous appeler" },
    ],
  },
];

export const FOOTER_LEGAL: NavItem[] = [
  { to: "/confidentialite", label: "Politique de confidentialité" },
  { to: "/conditions", label: "Conditions d'utilisation" },
];

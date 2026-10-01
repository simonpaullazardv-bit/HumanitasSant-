/**
 * Configuration déclarative des tableaux de bord par rôle :
 * navigation, intitulés et modules annoncés.
 */
import {
  Activity,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  FolderOpen,
  Hospital,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Users,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface DashboardNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface DashboardConfig {
  /** Rôles autorisés à ouvrir ce tableau de bord. */
  allowed: readonly UserRole[];
  title: string;
  subtitle: string;
  nav: DashboardNavItem[];
  modules: string[];
}

const SITE_NAV: DashboardNavItem[] = [];

export const DASHBOARDS: Record<string, DashboardConfig> = {
  direction_generale: {
    allowed: ["directeur_general"],
    title: "Direction Générale",
    subtitle:
      "Pilotage stratégique de Humanitas : performance, couverture, finances, réseau de soins, risques et décisions de gouvernance.",
    nav: [
      { label: "Tableau de bord", to: "/portail/direction-generale", icon: LayoutDashboard },
      { label: "Adhérents", to: "/portail/adherents", icon: Users },
      { label: "Finances", to: "/portail/finance", icon: Banknote },
      { label: "Prises en charge", to: "/portail/prises-en-charge", icon: Stethoscope },
      { label: "Réseau de soins", to: "/portail/partenaires", icon: Hospital },
      { label: "Rapports", to: "/portail/rapports", icon: BarChart3 },
      { label: "GED", to: "/portail/ged", icon: FolderOpen },
      { label: "Audit", to: "/portail/securite", icon: ShieldCheck },
    ],
    modules: [
      "Indicateurs consolidés issus exclusivement des tables opérationnelles",
      "Suivi de la couverture adhérents et bénéficiaires",
      "Performance financière et engagements envers le réseau",
      "Prises en charge, remboursements et qualité de service",
      "Pilotage du réseau de soins et conventions",
      "Lecture stratégique des risques, alertes et journaux d'audit",
      "Rapports de Direction Générale et documents institutionnels",
      "Suivi des gratifications et critères de fidélité",
    ],
  },
  administration: {
    allowed: ["super_admin", "administrateur"],
    title: "Pilotage général de la mutuelle",
    subtitle:
      "Vue consolidée des adhésions, des finances et du réseau. Gestion des utilisateurs, des rôles et des contenus publics.",
    nav: [
      { label: "Tableau de bord", to: "/portail/administration", icon: LayoutDashboard },
      { label: "Adhérents", to: "/portail/adherents", icon: Users },
      { label: "Finances", to: "/portail/finance", icon: Banknote },
      { label: "Cotisations", to: "/portail/cotisations", icon: Banknote },
      { label: "Cartes", to: "/portail/cartes", icon: CreditCard },
      { label: "Prises en charge", to: "/portail/prises-en-charge", icon: Stethoscope },
      { label: "Remboursements", to: "/portail/remboursements", icon: Banknote },
      { label: "Réseau de soins", to: "/portail/partenaires", icon: Hospital },
      { label: "RH & Admin", to: "/portail/rh", icon: UserCog },
      { label: "Rapports & PDF", to: "/portail/rapports", icon: BarChart3 },
      { label: "GED Documents", to: "/portail/ged", icon: FolderOpen },
      { label: "Notifications", to: "/portail/notifications", icon: Bell },
      { label: "Sécurité & Audit", to: "/portail/securite", icon: ShieldCheck },
      { label: "Paramètres", to: "/portail/parametres", icon: Settings2 },

      ...SITE_NAV,
    ],
    modules: [
      "Gestion des utilisateurs et attribution des rôles",
      "CMS : textes, images, tarifs et actualités",
      "Référentiels : catégories, partenaires, agences",
      "Journal d'audit et traçabilité des actions",
      "Rapports consolidés et exports",
      "Paramètres de sécurité de la plateforme",
    ],
  },
  coordination: {
    allowed: ["super_admin", "administrateur", "coordonnateur"],
    title: "Coordination des adhésions",
    subtitle:
      "Suivi des dossiers d'adhésion, des bénéficiaires et de la relation avec les établissements partenaires.",
    nav: [
      { label: "Tableau de bord", to: "/portail/coordination", icon: LayoutDashboard },
      { label: "Adhérents", to: "/portail/adherents", icon: Users },
      { label: "Terrain", to: "/portail/agent", icon: ClipboardList },
      { label: "Cotisations", to: "/portail/cotisations", icon: Banknote },
      { label: "Cartes", to: "/portail/cartes", icon: CreditCard },
      { label: "Prises en charge", to: "/portail/prises-en-charge", icon: Stethoscope },
      { label: "Partenaires", to: "/portail/partenaires", icon: Hospital },
    ],
    modules: [
      "Création et validation des dossiers d'adhésion",
      "Gestion des bénéficiaires et ayants droit",
      "Renouvellements et relances",
      "Émission des cartes de membre avec QR code",
      "Suivi des conventions hospitalières",
      "Suivi et validation des gratifications",
    ],
  },
  medical: {
    allowed: ["super_admin", "administrateur", "medecin_conseil"],
    title: "Médecine conseil",
    subtitle:
      "Validation médicale des prises en charge, contrôle des actes déclarés et avis sur les dossiers sensibles.",
    nav: [
      { label: "Tableau de bord", to: "/portail/medical", icon: LayoutDashboard },
      { label: "Prises en charge", to: "/portail/prises-en-charge", icon: Stethoscope },
      { label: "Réseau de soins", to: "/portail/partenaires", icon: Stethoscope },
    ],
    modules: [
      "File des demandes de prise en charge",
      "Contrôle des actes et cohérence médicale",
      "Avis motivés et historique des décisions",
      "Protocoles de soins et plafonds par catégorie",
    ],
  },
  finance: {
    allowed: ["super_admin", "administrateur", "financier"],
    title: "Direction financière",
    subtitle:
      "Cotisations, encaissements, facturation hospitalière et reporting financier de la mutuelle.",
    nav: [
      { label: "Tableau de bord", to: "/portail/finance", icon: LayoutDashboard },
      { label: "Adhérents", to: "/portail/adherents", icon: Users },
      { label: "Cotisations", to: "/portail/cotisations", icon: Banknote },
      { label: "Cartes", to: "/portail/cartes", icon: CreditCard },
      { label: "Remboursements", to: "/portail/remboursements", icon: Banknote },
      { label: "Partenaires", to: "/portail/partenaires", icon: Hospital },
    ],
    modules: [
      "Appels de cotisations et échéanciers",
      "Encaissements et rapprochement des paiements",
      "Facturation des établissements partenaires",
      "Reporting : recettes, impayés, taux de recouvrement",
      "Exports comptables",
    ],
  },
  agent: {
    allowed: ["super_admin", "administrateur", "coordonnateur", "agent_humanitas"],
    title: "Espace agent terrain",
    subtitle:
      "Enrôlement des nouveaux adhérents, collecte des cotisations et accompagnement des familles.",
    nav: [
      { label: "Tableau de bord", to: "/portail/agent", icon: LayoutDashboard },
      { label: "Adhérents", to: "/portail/adherents", icon: Users },
      { label: "Coordination", to: "/portail/coordination", icon: ClipboardList },
      { label: "Cotisations", to: "/portail/cotisations", icon: Banknote },
      { label: "Cartes", to: "/portail/cartes", icon: CreditCard },
    ],
    modules: [
      "Enrôlement rapide avec photo et pièces jointes",
      "Encaissement des cotisations sur le terrain",
      "Suivi de portefeuille et objectifs",
      "Mode hors-ligne et synchronisation",
    ],
  },
  entreprise: {
    allowed: ["entreprise"],
    title: "Espace entreprise partenaire",
    subtitle:
      "Suivi des collaborateurs couverts par votre contrat collectif et des cotisations associées.",
    nav: [
      { label: "Tableau de bord", to: "/portail/entreprise", icon: LayoutDashboard },
      { label: "Contrat collectif", to: "/portail/entreprise", icon: FileText },
    ],
    modules: [
      "Liste des collaborateurs couverts",
      "Suivi des collaborateurs et de leurs bénéficiaires de couverture",
      "Factures et cotisations de l'entreprise",
      "Attestations et documents contractuels",
    ],
  },
  hopital: {
    allowed: ["hopital"],
    title: "Espace établissement de soins",
    subtitle:
      "Vérification des droits des adhérents, transmission des actes et suivi des facturations.",
    nav: [
      { label: "Tableau de bord", to: "/portail/hopital", icon: LayoutDashboard },
      { label: "Contrôle des droits", to: "/portail/espace-partenaire", icon: BadgeCheck },
      { label: "Prises en charge", to: "/portail/espace-partenaire", icon: Stethoscope },
    ],
    modules: [
      "Vérification d'un adhérent par QR code",
      "Déclaration des actes réalisés",
      "Demandes de prise en charge",
      "Suivi des factures et règlements",
    ],
  },
  pharmacie: {
    allowed: ["pharmacie"],
    title: "Espace Pharmacie partenaire",
    subtitle:
      "Vérification sécurisée des membres, prestations pharmaceutiques autorisées et suivi de vos opérations Humanitas.",
    nav: [
      { label: "Tableau de bord", to: "/portail/pharmacie", icon: LayoutDashboard },
      { label: "Contrôle des droits", to: "/portail/pharmacie", icon: BadgeCheck },
      { label: "Prises en charge", to: "/portail/pharmacie", icon: Stethoscope },
      { label: "Factures", to: "/portail/pharmacie", icon: FileText },
      { label: "Notifications", to: "/portail/pharmacie", icon: Bell },
    ],
    modules: [
      "Recherche par code Humanitas ou QR code",
      "Affichage limité au strict nécessaire pour la prise en charge",
      "Enregistrement des prises en charge autorisées",
      "Facturation et documents du propre établissement",
      "Notifications métier en temps réel",
    ],
  },
  laboratoire: {
    allowed: ["laboratoire"],
    title: "Espace Laboratoire partenaire",
    subtitle:
      "Contrôle des droits, prestations de laboratoire autorisées et facturation de votre établissement.",
    nav: [
      { label: "Tableau de bord", to: "/portail/laboratoire", icon: LayoutDashboard },
      { label: "Contrôle des droits", to: "/portail/laboratoire", icon: BadgeCheck },
      { label: "Prises en charge", to: "/portail/laboratoire", icon: Stethoscope },
      { label: "Factures", to: "/portail/laboratoire", icon: FileText },
      { label: "Notifications", to: "/portail/laboratoire", icon: Bell },
    ],
    modules: [
      "Recherche par code Humanitas ou QR code",
      "Vérification des droits et catégorie d'adhésion",
      "Déclaration des prestations autorisées",
      "Facturation et documents de votre établissement uniquement",
      "Notifications métier en temps réel",
    ],
  },
  centre_bien_etre: {
    allowed: ["centre_bien_etre"],
    title: "Espace Centre de bien-être partenaire",
    subtitle:
      "Vérification des membres, prestations de bien-être autorisées et suivi de votre convention Humanitas.",
    nav: [
      { label: "Tableau de bord", to: "/portail/centre-bien-etre", icon: LayoutDashboard },
      { label: "Contrôle des droits", to: "/portail/centre-bien-etre", icon: BadgeCheck },
      { label: "Prises en charge", to: "/portail/centre-bien-etre", icon: Stethoscope },
      { label: "Factures", to: "/portail/centre-bien-etre", icon: FileText },
      { label: "Notifications", to: "/portail/centre-bien-etre", icon: Bell },
    ],
    modules: [
      "Recherche par code Humanitas ou QR code",
      "Affichage limité aux informations utiles à la prestation",
      "Suivi des prises en charge de votre structure",
      "Facturation et documents de votre établissement uniquement",
      "Notifications métier en temps réel",
    ],
  },
  adherent: {
    allowed: ["adherent"],
    title: "Mon espace adhérent",
    subtitle:
      "Votre carte de membre, vos cotisations, vos bénéficiaires et votre historique de soins.",
    nav: [
      { label: "Mon espace", to: "/portail/adherent", icon: LayoutDashboard },
      { label: "Mon dossier", to: "/portail/mon-dossier", icon: Users },
      { label: "Mes cotisations", to: "/portail/cotisations", icon: Banknote },
      { label: "Ma carte", to: "/portail/adherent", icon: CreditCard },
      { label: "Mes documents", to: "/portail/adherent", icon: FileText },
    ],
    modules: [
      "Carte de membre digitale avec QR code",
      "Historique des cotisations et reçus",
      "Gestion des bénéficiaires de la famille",
      "Suivi des remboursements et prises en charge",
      "Réseau de soins conventionné à proximité",
    ],
  },
  beneficiaire: {
    allowed: ["adherent"],
    title: "Mon espace bénéficiaire",
    subtitle:
      "Compte personnel du bénéficiaire, séparé du titulaire par beneficiaire_id et soumis au même rôle applicatif adherent.",
    nav: [
      { label: "Mon espace", to: "/portail/beneficiaire", icon: LayoutDashboard },
      { label: "Ma carte", to: "/portail/beneficiaire", icon: CreditCard },
      { label: "Mes prises en charge", to: "/portail/beneficiaire", icon: Stethoscope },
    ],
    modules: [
      "Identité et code bénéficiaire",
      "Carte personnelle et QR",
      "Historique personnel de prise en charge",
      "Notifications personnelles",
    ],
  },
};

export const DASHBOARD_ICONS = { Activity, UserCog };

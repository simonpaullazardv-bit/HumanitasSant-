import type { Achievement, EventItem, FaqItem, MembershipPlan, ServiceItem } from "@/types";
import { LOCAL_GALLERY_URLS } from "@/data/public-fallbacks";
import { ACTIVE_SOCIALS, SOCIAL_NETWORK_CATALOG } from "@/data/socials";

/**
 * Identité publique locale : utilisée immédiatement, puis remplacée par Supabase
 * dès qu'une valeur publique validée est disponible.
 */
export const SITE = {
  name: "HUMANITAS SANTÉ",
  legalName: "Mutuelle de Santé HUMANITAS",
  shortName: "Humanitas Santé",
  domain: "humanitassante.org",
  website: "https://humanitassante.org",
  baseline: "La santé pour tous, dans la dignité et la solidarité.",
  phone: "+243 844 433 025",
  phoneSecondary: "+243 900 000 000",
  whatsapp: "+243 844 433 025",
  whatsappLink: "https://wa.me/243844433025",
  email: "contact@humanitassante.org",
  emailInfo: "info@humanitassante.org",
  emailAdmin: "admin@humanitassante.org",
  emailDG: "dg@humanitassante.org",
  emailCoordo: "coordo@humanitassante.org",
  facebook: "https://facebook.com/humanitassante",
  address: "12, PLAZZA, avenue Mavinga, Quartier Bahumbu, Commune de la N'SELE, ville de Kinshasa",
  address2: "Victoire — Bâtiment Carrefour des Jeunes",
  city: "Kinshasa, République Démocratique du Congo",
  hours: "Selon les horaires officiels publiés par Humanitas Santé.",
};

export const IMAGES = {
  logo: "/img/logo.jpg",
  dg: "/img/dg.png",
  dgMessage: "/img/messagedg.png",
  presentation: "/img/presentationhumanitas.png",
  services: "/img/services.jpg",
  equipe: "/img/equipe.png",
  evenements: "/img/evenements.jpg",
  objectifs: "/img/objectifs.png",
  categories: "/img/categories.png",
  couverture: "/img/couverture.png",
  gallery: LOCAL_GALLERY_URLS,
};

export const SOCIALS = ACTIVE_SOCIALS;

export { SOCIAL_NETWORK_CATALOG };

export const NAV_LINKS = [
  { label: "Accueil", to: "/" },
  { label: "Tout savoir sur Humanitas", to: "/a-propos" },
  { label: "Services", to: "/services" },
  { label: "Nos réalisations", to: "/realisations" },
  { label: "Nos évènements", to: "/evenements" },
  { label: "Tarifs", to: "/tarifs" },
  { label: "Nous contacter", to: "/contact" },
] as const;

export const SERVICES: ServiceItem[] = [
  {
    slug: "consultations",
    title: "Consultations médicales",
    description:
      "Médecine générale et spécialisée dans notre réseau conventionné, sans avance de frais.",
    icon: "stethoscope",
  },
  {
    slug: "sante-mentale",
    title: "Santé mentale",
    description:
      "Accompagnement psychologique, écoute et thérapies individuelles en toute confidentialité.",
    icon: "brain",
  },
  {
    slug: "nutrition",
    title: "Nutrition & Diététique",
    description:
      "Bilan nutritionnel personnalisé, accompagnement diététique et prévention des maladies métaboliques.",
    icon: "apple",
  },
  {
    slug: "pharmacie",
    title: "Pharmacie & Médicaments",
    description:
      "Délivrance de médicaments essentiels et soins pharmaceutiques dans nos pharmacies partenaires.",
    icon: "pill",
  },
  {
    slug: "laboratoire",
    title: "Laboratoire & Imagerie",
    description:
      "Analyses biologiques, radiologie, scanner et échographies avec résultats sécurisés et rapides.",
    icon: "microscope",
  },
  {
    slug: "hospitalisation",
    title: "Hospitalisation",
    description:
      "Prise en charge directe des séjours hospitaliers, chirurgies et soins intensifs partenaires.",
    icon: "hospital",
  },
  {
    slug: "ambulance",
    title: "Ambulance & Urgences",
    description:
      "Service de transport médicalisé d'urgence selon les modalités opérationnelles publiées par Humanitas.",
    icon: "ambulance",
  },
  {
    slug: "bien-etre",
    title: "Centre de bien-être",
    description:
      "Kinésithérapie, soins de remise en forme, massages thérapeutiques et médecine préventive.",
    icon: "heart-pulse",
  },
];

export const ADVANTAGES = [
  {
    title: "Zéro avance de frais",
    description: "Votre carte d'adhérent suffit dans tout le réseau conventionné.",
    icon: "credit-card",
  },
  {
    title: "Réseau de soins étendu",
    description: "Hôpitaux, cliniques, pharmacies et laboratoires partenaires sélectionnés.",
    icon: "network",
  },
  {
    title: "Remboursements rapides",
    description: "Délai de traitement communiqué après réception et vérification du dossier.",
    icon: "timer",
  },
  {
    title: "Accompagnement humain",
    description: "Un coordonnateur dédié et un médecin conseil à votre écoute.",
    icon: "hand-heart",
  },
];

export const WHY_US = [
  {
    title: "Une gouvernance transparente",
    description:
      "Comptes audités, rapports publiés et assemblée générale annuelle ouverte aux adhérents.",
  },
  {
    title: "Une expertise médicale reconnue",
    description:
      "Un médecin conseil valide chaque protocole afin de garantir la qualité des soins délivrés.",
  },
  {
    title: "Une technologie au service du soin",
    description:
      "Carte digitale, suivi des dossiers en ligne et tableaux de bord pour nos partenaires.",
  },
  {
    title: "Une solidarité concrète",
    description:
      "La mutualisation permet de protéger les familles, les entreprises et les communautés.",
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "campagnes",
    title: "Campagnes de dépistage gratuites",
    description:
      "Dépistage du diabète, de l'hypertension et du paludisme dans les quartiers périphériques.",
    metric: "Réalisation documentée",
  },
  {
    id: "conventions",
    title: "Conventionnement hospitalier",
    description:
      "Signature d'accords tarifaires avec les principaux hôpitaux et cliniques de référence.",
    metric: "Conventionnement documenté",
  },
  {
    id: "entreprises",
    title: "Couverture des entreprises",
    description: "Déploiement de contrats collectifs pour les PME, ONG et institutions publiques.",
    metric: "Déploiement documenté",
  },
  {
    id: "digital",
    title: "Digitalisation du parcours adhérent",
    description:
      "Carte d'adhérent numérique, suivi des remboursements et espace personnel sécurisé.",
    metric: "Digitalisation documentée",
  },
];

export const EVENTS: EventItem[] = [
  {
    id: "journee-sante",
    title: "Journée santé communautaire",
    date: "12 septembre 2026",
    location: "Esplanade Humanitas",
    excerpt: "Consultations gratuites, dépistages et conseils nutritionnels pour toute la famille.",
    image: IMAGES.evenements,
  },
  {
    id: "forum-mutualiste",
    title: "Forum mutualiste annuel",
    date: "24 octobre 2026",
    location: "Centre de conférences",
    excerpt: "Rencontre entre adhérents, entreprises partenaires et professionnels de santé.",
    image: IMAGES.presentation,
  },
  {
    id: "semaine-bien-etre",
    title: "Semaine du bien-être",
    date: "05 – 10 décembre 2026",
    location: "Centre de bien-être Humanitas",
    excerpt:
      "Ateliers sport-santé, nutrition, santé mentale et prévention des maladies chroniques.",
    image: IMAGES.services,
  },
];

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    tier: "bronze",
    name: "Bronze",
    price: "25 $",
    period: "/ mois",
    tagline: "L'essentiel pour se protéger",
    benefits: [
      "Consultations de médecine générale",
      "Médicaments essentiels génériques",
      "Analyses de laboratoire de base",
      "Prise en charge à 60%",
    ],
  },
  {
    tier: "argent",
    name: "Argent",
    price: "50 $",
    period: "/ mois",
    tagline: "Pour les familles prévoyantes",
    benefits: [
      "Tout Bronze inclus",
      "Consultations spécialisées",
      "Imagerie médicale courante",
      "Prise en charge à 75%",
    ],
  },
  {
    tier: "or",
    name: "Or",
    price: "75 $",
    period: "/ mois",
    tagline: "La couverture la plus choisie",
    highlighted: true,
    benefits: [
      "Tout Argent inclus",
      "Hospitalisation et chirurgie",
      "Maternité et pédiatrie",
      "Prise en charge à 90%",
    ],
  },
  {
    tier: "platine",
    name: "Platine",
    price: "100 $",
    period: "/ mois",
    tagline: "Excellence et accompagnement premium",
    benefits: [
      "Tout Or inclus",
      "Soins dentaires et optiques",
      "Évacuation sanitaire et chambre individuelle",
      "Prise en charge selon la catégorie et les droits ouverts",
    ],
  },
];

export const FAQ: FaqItem[] = [
  {
    question: "Comment devenir adhérent Humanitas ?",
    answer:
      "Remplissez le formulaire d'adhésion en ligne ou rendez-vous dans l'une de nos antennes. Après validation de votre dossier, votre carte d'adhérent est activée selon le délai opérationnel publié par Humanitas.",
  },
  {
    question: "Quel est le délai de carence ?",
    answer:
      "Les délais de carence applicables sont ceux de la catégorie d'adhésion validée et publiée par Humanitas.",
  },
  {
    question: "Puis-je couvrir ma famille ?",
    answer:
      "Oui. Chaque adhérent principal peut rattacher son conjoint et ses enfants mineurs avec une cotisation additionnelle préférentielle.",
  },
  {
    question: "Comment fonctionne la prise en charge ?",
    answer:
      "Présentez votre carte dans une structure conventionnée : Humanitas règle directement la part couverte, vous ne payez que le ticket modérateur.",
  },
  {
    question: "Les entreprises peuvent-elles souscrire ?",
    answer:
      "Absolument. Nous proposons des contrats collectifs avec tarifs dégressifs, reporting mensuel et espace dédié pour le responsable RH.",
  },
];

export type Partner = {
  name: string;
  category: string;
  description: string;
  /** Logo optionnel : déposer le fichier dans public/img/partenaires/ */
  logo?: string;
};

/**
 * Les établissements et entreprises partenaires ne sont pas pré-remplis ici.
 * Leur affichage public doit venir de Supabase après validation institutionnelle.
 */
export const HOSPITAL_PARTNERS: Partner[] = [];
export const COMPANY_PARTNERS: Partner[] = [];

export const DASHBOARD_ROLES = [
  "Super Admin",
  "Administrateur",
  "Coordonnateur",
  "Médecin Conseil",
  "Financier",
  "Agent Humanitas",
  "Entreprise",
  "Hôpital",
  "Adhérent",
];

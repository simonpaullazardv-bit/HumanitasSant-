import { LOCAL_PUBLIC_IMAGE_URLS, LOCAL_PUBLIC_VIDEO_URLS } from "@/data/public-media.generated";

/**
 * Sources locales de secours pour le site vitrine.
 *
 * Règle : Supabase reste prioritaire dès qu'une donnée publique valide est publiée.
 * Tant que Supabase est vide, indisponible ou qu'une ressource publique n'existe pas,
 * le frontend peut continuer à fonctionner avec les médias et contenus versionnés ici.
 */

export const LOCAL_SITE_SETTINGS = [
  { cle: "contact_telephone", categorie: "contact", valeur: JSON.stringify("+243 844 433 025") },
  { cle: "contact_telephone_secondaire", categorie: "contact", valeur: JSON.stringify("+243 900 000 000") },
  { cle: "contact_email", categorie: "contact", valeur: JSON.stringify("contact@humanitassante.org") },
  { cle: "contact_email_info", categorie: "contact", valeur: JSON.stringify("info@humanitassante.org") },
  { cle: "contact_email_admin", categorie: "contact", valeur: JSON.stringify("admin@humanitassante.org") },
  { cle: "contact_email_dg", categorie: "contact", valeur: JSON.stringify("dg@humanitassante.org") },
  { cle: "contact_email_coordo", categorie: "contact", valeur: JSON.stringify("coordo@humanitassante.org") },
  {
    cle: "contact_adresse",
    categorie: "contact",
    valeur: JSON.stringify("12, PLAZZA, avenue Mavinga, Quartier Bahumbu, Commune de la N'SELE, ville de Kinshasa"),
  },
  {
    cle: "contact_adresse_2",
    categorie: "contact",
    valeur: JSON.stringify("Victoire — Bâtiment Carrefour des Jeunes"),
  },
  {
    cle: "contact_ville",
    categorie: "contact",
    valeur: JSON.stringify("Kinshasa, République Démocratique du Congo"),
  },
  { cle: "site_domaine", categorie: "site", valeur: JSON.stringify("https://humanitassante.org") },
  {
    cle: "site_baseline",
    categorie: "site",
    valeur: JSON.stringify("La santé pour tous, dans la dignité et la solidarité."),
  },
];

export const LOCAL_SOCIAL_LINKS = [
  { plateforme: "facebook", url: "https://facebook.com/humanitassante", libelle: "Facebook", ordre: 1 },
  { plateforme: "whatsapp", url: "https://wa.me/243844433025", libelle: "WhatsApp", ordre: 2 },
  { plateforme: "instagram", url: "https://instagram.com/humanitassante", libelle: "Instagram", ordre: 3 },
  { plateforme: "tiktok", url: "https://tiktok.com/@humanitassante", libelle: "TikTok", ordre: 4 },
  { plateforme: "youtube", url: "https://youtube.com/@humanitassante", libelle: "YouTube", ordre: 5 },
  { plateforme: "linkedin", url: "https://linkedin.com/company/humanitassante", libelle: "LinkedIn", ordre: 6 },
  { plateforme: "x", url: "https://x.com/humanitassante", libelle: "X", ordre: 7 },
];

export const LOCAL_MEMBERSHIP_TIERS = [
  {
    id: "local-bronze",
    code: "bronze",
    nom: "Bronze",
    prix_usd: 25,
    periode: "mois",
    tagline: "Une couverture de base solide pour les besoins essentiels.",
    description: "Couverture de base : consultations, premiers soins, réduction des frais médicaux et orientation.",
    plafond_usd: null,
    taux_couverture: null,
    couverture_label: "Couverture de base",
    avantages: ["Consultations et premiers soins", "Orientation médicale", "Réduction des frais médicaux"],
    ordre: 1,
    mise_en_avant: false,
  },
  {
    id: "local-argent",
    code: "argent",
    nom: "Argent",
    prix_usd: 50,
    periode: "mois",
    tagline: "Une couverture élargie et un remboursement amélioré.",
    description: "Couverture intermédiaire : consultations, examens de base et prise en charge partielle des hospitalisations.",
    plafond_usd: null,
    taux_couverture: null,
    couverture_label: "Couverture intermédiaire",
    avantages: ["Consultations", "Examens de base", "Prise en charge partielle des hospitalisations"],
    ordre: 2,
    mise_en_avant: false,
  },
  {
    id: "local-or",
    code: "or",
    nom: "Or",
    prix_usd: 75,
    periode: "mois",
    tagline: "Des avantages exclusifs et un niveau de remboursement supérieur.",
    description: "Couverture étendue : consultations, examens et hospitalisations partielles, avec médicaments essentiels.",
    plafond_usd: null,
    taux_couverture: null,
    couverture_label: "Couverture étendue",
    avantages: ["Consultations et examens", "Hospitalisations selon les droits", "Médicaments essentiels"],
    ordre: 3,
    mise_en_avant: true,
  },
  {
    id: "local-platine",
    code: "platine",
    nom: "Platine",
    prix_usd: 100,
    periode: "mois",
    tagline: "La couverture la plus complète pour une sérénité maximale.",
    description: "Couverture médicale la plus complète, selon les droits ouverts et les conditions publiées par Humanitas.",
    plafond_usd: null,
    taux_couverture: null,
    couverture_label: "Couverture la plus complète",
    avantages: ["Consultations et examens", "Hospitalisation", "Médicaments essentiels", "Urgences selon les droits ouverts"],
    ordre: 4,
    mise_en_avant: false,
  },
];

export const LOCAL_INSTITUTIONAL_PARTNERS = [
  {
    id: "local-lph",
    name: "Lumen Pacis Humanitas (LPH)",
    category: "Organisation partenaire / réseau Humanitas",
    description: "Lumen Pacis Humanitas accompagne l'action humanitaire et institutionnelle portée autour de la vision Humanitas.",
    type: "institutionnel",
  },
  {
    id: "local-rapido",
    name: "Rapido",
    category: "Partenaire associé",
    description: "Partenaire associé cité dans l'écosystème institutionnel Humanitas.",
    type: "institutionnel",
  },
  {
    id: "local-mon-ami",
    name: "ASBL Mon Ami",
    category: "Partenaire associatif",
    description: "Partenaire associatif à présenter dans l'écosystème institutionnel Humanitas.",
    type: "institutionnel",
  },
];

export const LOCAL_TEAM = [
  {
    id: "local-team-dg",
    nom: "Direction Générale",
    fonction: "Direction Générale",
    bio: "Cadre institutionnel réservé à la présentation officielle de la Direction Générale.",
    photo_url: "/img/dg.png",
    email: "dg@humanitassante.org",
    linkedin_url: null,
    ordre: 1,
  },
  {
    id: "local-team-coordination",
    nom: "Coordination des programmes",
    fonction: "Coordination des programmes",
    bio: "Espace de présentation de la coordination des programmes Humanitas.",
    photo_url: "/img/gallery/coordonnateurprogrammes.jpg",
    email: "coordo@humanitassante.org",
    linkedin_url: null,
    ordre: 2,
  },
  {
    id: "local-team-administration",
    nom: "Équipe administrative",
    fonction: "Administration Humanitas",
    bio: "Équipe administrative et opérationnelle au service des adhérents et partenaires.",
    photo_url: "/img/gallery/equipeadministrative.jpg",
    email: "info@humanitassante.org",
    linkedin_url: null,
    ordre: 3,
  },
];

export const LOCAL_DIRECTOR = {
  name: "Direction Générale",
  title: "Directeur Général — Humanitas Santé",
  photo_url: "/img/dg.png",
  message_image_url: "/img/messagedg.png",
};

export const LOCAL_PRESENTATION = {
  title: "Une mutuelle solidaire, une couverture santé pensée pour tous",
  text: "Humanitas Santé est une mutuelle de santé et un centre de bien-être qui place la solidarité, la prévention, la dignité et l'accès aux soins au cœur de son action.",
  photoUrl: "/img/presentationhumanitas.png",
  pillars: [
    "Une couverture santé adaptée aux besoins des adhérents.",
    "Un réseau de soins et de partenaires à développer et valider.",
    "La prévention et le bien-être comme piliers de la santé durable.",
    "Une gestion numérique et traçable au service des adhérents.",
  ],
};

export const LOCAL_GALLERY_URLS = LOCAL_PUBLIC_IMAGE_URLS.slice();

export const LOCAL_VITRINE_IMAGES = LOCAL_PUBLIC_IMAGE_URLS.slice();

/** Vidéos locales : indexées automatiquement depuis public/videos/ au démarrage/build. */
export const LOCAL_VIDEO_URLS = LOCAL_PUBLIC_VIDEO_URLS.slice();

export const LOCAL_MEDIA_IMAGES = LOCAL_VITRINE_IMAGES.map((url, index) => ({
  id: `local-image-${index + 1}`,
  nom: url.split("/").pop() ?? `Image Humanitas ${index + 1}`,
  bucket: "public",
  storage_path: url.replace(/^\//, ""),
  url_publique: url,
  type: "image" as const,
  categorie: "institutionnel",
  texte_alternatif: "Humanitas Santé — image institutionnelle",
  legende: "Humanitas Santé",
  created_at: `2026-08-13T00:${String(index).padStart(2, "0")}:00.000Z`,
  url,
}));


export const LOCAL_MEDIA_VIDEOS = LOCAL_VIDEO_URLS.map((url, index) => ({
  id: `local-video-${index + 1}`,
  nom: url.split("/").pop() ?? `Vidéo Humanitas ${index + 1}`,
  bucket: "public",
  storage_path: url.replace(/^\//, ""),
  url_publique: url,
  type: "video" as const,
  categorie: "institutionnel",
  texte_alternatif: "Vidéo institutionnelle Humanitas Santé",
  legende: "Humanitas Santé",
  created_at: `2026-08-13T01:${String(index).padStart(2, "0")}:00.000Z`,
  url,
}));

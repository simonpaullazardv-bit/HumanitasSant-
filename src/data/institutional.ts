/**
 * Contenus institutionnels par défaut.
 * Ils servent de repli lorsque la page correspondante n'est pas encore
 * publiée dans le CMS (table cms_pages / cms_sections).
 */
import type { ContentBlock } from "@/components/shared/ContentPage";

export const VISION_BLOCKS: ContentBlock[] = [
  {
    titre: "Notre vision",
    contenu:
      "Faire de la protection sociale en santé un droit accessible à chaque famille congolaise, en construisant une mutuelle solide, transparente et durable, capable d'accompagner ses adhérents tout au long de leur vie.",
  },
  {
    titre: "À l'horizon 2030",
    contenu:
      "Un réseau conventionné présent dans chaque commune de Kinshasa, une couverture étendue aux principales provinces, et une gestion entièrement numérisée offrant à chaque adhérent la maîtrise de ses droits en temps réel.",
  },
];

export const MISSION_BLOCKS: ContentBlock[] = [
  {
    titre: "Notre mission",
    contenu:
      "Mutualiser les moyens de nos adhérents afin de garantir l'accès à des soins de qualité, prévenir la maladie et promouvoir le bien-être, tout en assurant une gestion rigoureuse et traçable des fonds collectés.",
  },
  {
    titre: "Nos engagements",
    contenu:
      "Transparence financière totale · Prise en charge rapide dans le réseau conventionné · Accompagnement humain des adhérents · Protection stricte des données personnelles et médicales.",
  },
];

export const VALEURS_BLOCKS: ContentBlock[] = [
  {
    titre: "Solidarité",
    contenu:
      "Chaque cotisation contribue à un fonds commun qui protège l'ensemble de la communauté mutualiste.",
  },
  {
    titre: "Intégrité",
    contenu:
      "Les ressources sont réparties selon des règles connues de tous et contrôlées à chaque étape.",
  },
  {
    titre: "Proximité",
    contenu:
      "Nos agents de terrain accompagnent les adhérents dans leur commune, du dossier d'adhésion au remboursement.",
  },
  {
    titre: "Excellence",
    contenu:
      "Nous sélectionnons nos partenaires de soins sur des critères de qualité, d'accueil et de traçabilité.",
  },
];

export const ADHERER_BLOCKS: ContentBlock[] = [
  {
    titre: "1. Choisir sa catégorie",
    contenu:
      "Bronze, Argent, Or ou Platine : chaque catégorie fixe le montant de la cotisation mensuelle, le taux de prise en charge et le plafond annuel.",
  },
  {
    titre: "2. Constituer son dossier",
    contenu:
      "Pièce d'identité, photo récente, adresse et coordonnées téléphoniques. Un adhérent individuel peut déclarer jusqu'à 4 bénéficiaires.",
  },
  {
    titre: "3. Régler les frais de carte",
    contenu:
      "La carte de membre est imprimée après validation du paiement des frais de carte par le service financier.",
  },
  {
    titre: "4. Activer ses droits",
    contenu:
      "Les droits aux prestations s'ouvrent après trois mensualités de cotisation. Les cotisations sont dues au plus tard le 5 de chaque mois.",
  },
];

export const PARTENARIAT_BLOCKS: ContentBlock[] = [
  {
    titre: "Devenir structure conventionnée",
    contenu:
      "Hôpitaux, cliniques, pharmacies, laboratoires et centres de bien-être peuvent rejoindre le réseau Humanitas. La convention précise les actes couverts, les tarifs négociés et le circuit de facturation.",
  },
  {
    titre: "Entreprises et institutions",
    contenu:
      "Offrez une couverture santé collective à vos employés et à leurs familles. Humanitas prend en charge l'enrôlement, les cartes et le suivi des consommations.",
  },
  {
    titre: "Comment nous contacter",
    contenu:
      "Adressez votre demande via le formulaire de contact ou par téléphone. Un chargé de partenariat vous recontacte après réception et vérification de votre demande.",
  },
];

export const RECRUTEMENT_BLOCKS: ContentBlock[] = [
  {
    titre: "Rejoindre Humanitas",
    contenu:
      "Nous recrutons régulièrement des agents de terrain, des gestionnaires de dossiers, des professionnels de santé et des profils administratifs.",
  },
  {
    titre: "Candidature spontanée",
    contenu:
      "Envoyez votre CV et votre lettre de motivation via le formulaire de contact en précisant le poste souhaité. Les offres ouvertes sont publiées dans nos actualités.",
  },
];

export const CONFIDENTIALITE_BLOCKS: ContentBlock[] = [
  {
    titre: "Données collectées",
    contenu:
      "Humanitas collecte uniquement les données nécessaires à la gestion des adhésions, des cotisations et des prestations : identité, coordonnées, bénéficiaires et historique de paiement.",
  },
  {
    titre: "Données médicales",
    contenu:
      "Les informations médicales sont strictement réservées au Médecin Conseil et aux personnels habilités. Elles ne sont jamais partagées avec des tiers non conventionnés.",
  },
  {
    titre: "QR Code et vérification",
    contenu:
      "Le QR Code figurant sur la carte de membre ne contient aucune donnée personnelle : il encode uniquement un jeton sécurisé permettant de vérifier la validité des droits.",
  },
  {
    titre: "Vos droits",
    contenu:
      "Vous pouvez demander l'accès, la rectification ou la suppression de vos données en contactant le service adhérents.",
  },
];

export const CONDITIONS_BLOCKS: ContentBlock[] = [
  {
    titre: "Objet",
    contenu:
      "Les présentes conditions régissent l'utilisation du site institutionnel Humanitas Santé et l'accès à l'espace adhérent.",
  },
  {
    titre: "Adhésion et cotisations",
    contenu:
      "L'adhésion est effective après validation du dossier et paiement des frais de carte. Les cotisations sont mensuelles et exigibles au plus tard le 5 de chaque mois. Tout retard entraîne un rappel automatique et peut suspendre les droits.",
  },
  {
    titre: "Prestations",
    contenu:
      "Toute prestation prise en charge doit être validée par le Médecin Conseil, dans la limite du plafond et du taux de couverture de la catégorie souscrite.",
  },
  {
    titre: "Responsabilité",
    contenu:
      "Humanitas s'efforce d'assurer l'exactitude des informations publiées sur ce site sans garantie d'exhaustivité. Les conditions contractuelles font foi.",
  },
];


/** Contenus institutionnels complémentaires issus des supports fournis. */
export const PRESENTATION_BLOCKS: ContentBlock[] = [
  {
    titre: "Présentation de HUMANITAS Santé",
    contenu:
      "La Mutuelle de Santé HUMANITAS est une initiative à vocation solidaire qui vise à faciliter l’accès à des soins de qualité, à promouvoir la prévention et le bien-être et à accompagner les familles, les entreprises et les communautés.",
  },
  {
    titre: "Notre approche",
    contenu:
      "HUMANITAS place la solidarité, la dignité humaine, la proximité et la prévention au cœur de son approche de couverture santé.",
  },
];

export const HISTORIQUE_BLOCKS: ContentBlock[] = [
  {
    titre: "Une dynamique humanitaire et sociale",
    contenu:
      "HUMANITAS Santé s’inscrit dans la dynamique humanitaire et sociale de Lumen Pacis Humanitas (LPH), avec l’ambition de répondre aux difficultés d’accès aux soins par un modèle organisé, solidaire et proche des communautés.",
  },
  {
    titre: "Développement de la mutuelle",
    contenu:
      "Le projet associe progressivement couverture santé, prévention, services de bien-être et réseau de partenaires sanitaires. Les dates historiques officielles seront complétées à partir des documents institutionnels validés, sans inventer de jalons.",
  },
];

export const OBJECTIFS_BLOCKS: ContentBlock[] = [
  {
    titre: "Objectif général",
    contenu:
      "Contribuer à une protection santé plus accessible, solidaire et durable, adaptée aux besoins des membres et aux réalités des familles, entreprises et communautés.",
  },
  {
    titre: "Prévention et éducation sanitaire",
    contenu:
      "Promouvoir la prévention, le dépistage, l’information et l’éducation sanitaire afin de favoriser une meilleure santé au quotidien.",
  },
  {
    titre: "Accès équitable aux soins",
    contenu:
      "Faciliter l’accès aux consultations, examens, médicaments, hospitalisations et autres prestations couvertes dans le cadre des règles de la mutuelle.",
  },
  {
    titre: "Réseau et proximité",
    contenu:
      "Développer des partenariats avec les hôpitaux, pharmacies, laboratoires, centres de bien-être et autres acteurs sanitaires afin de rapprocher les services des membres.",
  },
];

export const OFFRES_COUVERTURE_BLOCKS: ContentBlock[] = [
  {
    titre: "Nos offres",
    contenu:
      "HUMANITAS propose différents niveaux de couverture afin de permettre à chaque membre de choisir une protection adaptée à ses besoins et à ses possibilités.",
  },
  {
    titre: "Bronze — 25 USD / mois",
    contenu:
      "Couverture de base destinée aux besoins essentiels : consultations, premiers soins, orientation sanitaire et réduction de certains frais selon les conditions applicables.",
  },
  {
    titre: "Argent — 50 USD / mois",
    contenu:
      "Couverture intermédiaire avec une protection plus étendue, notamment pour les consultations et examens de base, selon les conditions de prise en charge.",
  },
  {
    titre: "Or — 75 USD / mois",
    contenu:
      "Couverture étendue avec un niveau de protection supérieur et des prestations plus larges, selon les conditions et plafonds applicables.",
  },
  {
    titre: "Platine — 100 USD / mois",
    contenu:
      "Niveau de couverture le plus complet de la grille actuelle, avec une protection plus large selon les conditions et plafonds applicables.",
  },
];

export const CENTRE_BIEN_ETRE_BLOCKS: ContentBlock[] = [
  {
    titre: "Centre de Bien-Être HUMANITAS",
    contenu:
      "Le Centre de Bien-Être complète l’approche de couverture santé par des actions de prévention, de relaxation, de remise en forme et d’accompagnement du bien-être.",
  },
  {
    titre: "Services",
    contenu:
      "Les services peuvent comprendre notamment la relaxation, les massages thérapeutiques, l’accompagnement personnalisé et les activités de prévention et de promotion du bien-être, selon les prestations officiellement ouvertes.",
  },
];

export const DIRECTOR_MESSAGE_BLOCKS: ContentBlock[] = [
  {
    titre: "Message du Directeur Général",
    contenu:
      "Humanitas Santé porte une conviction simple : la santé doit être protégée avec dignité, solidarité et responsabilité. Notre ambition est de construire une mutuelle moderne, proche des communautés, fondée sur la prévention, la qualité des soins, l’accompagnement et le bien-être.",
  },
  {
    titre: "Notre engagement",
    contenu:
      "Nous voulons développer avec nos membres et nos partenaires une communauté de santé mieux protégée, mieux informée et accompagnée avec humanité. Votre santé demeure notre priorité.",
  },
];

# Humanitas Santé — stratégie frontend hybride public / Supabase

## Principe

Le site vitrine fonctionne sans dépendre d'une base Supabase déjà remplie.

1. Les fichiers institutionnels présents dans `public/` constituent le socle local.
2. Les contenus publiés dans Supabase prennent la priorité lorsqu'ils existent.
3. Pour les galeries, les médias Supabase et les médias locaux sont fusionnés sans supprimer les ressources locales.
4. Les statistiques publiques n'ont volontairement aucun fallback chiffré : sans donnée publique validée, elles restent masquées.
5. Le message du Directeur Général reste un visuel (`public/img/messagedg.png`) et son cadre est prêt pour un futur remplacement par une URL Supabase.
6. Les vidéos locales sont placées dans `public/videos/` et indexées automatiquement par `scripts/generate-public-media.mjs` avant `dev` et `build`. Aucune déclaration manuelle dans un tableau TypeScript n’est nécessaire.

## Médias locaux

- `public/img/` : logos, DG, présentation, objectifs, catégories, couverture et autres visuels de vitrine.
- `public/img/gallery/` : toute la galerie institutionnelle locale, sans filtre de catégorie imposé.
- `public/videos/` : espace réservé aux vidéos locales.
- favicon.io : `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `site.webmanifest`.

## Supabase

Supabase reste la source dynamique pour les contenus publiés et administrables : médias, catégories, partenaires, équipe, paramètres publics, etc. Le code prévoit un repli local pour les éléments institutionnels qui doivent rester visibles avant le remplissage complet de la base.

## Lovable / Google AI Studio / Gemini

Les dépendances techniques historiques ne sont pas supprimées brutalement dans cette version. L'authentification Lovable reste conservée tant qu'elle est utilisée par `src/services/auth.service.ts`. Les traces de marque Google AI Studio et les anciennes URLs `*.lovable.app` ne sont plus utilisées dans l'identité publique du site.

## Identité publique

- Domaine cible : `https://humanitassante.org`
- Téléphone principal : `+243 844 433 025`
- Adresse 2 : `Victoire — Bâtiment Carrefour des Jeunes`
- Emails institutionnels : `contact@`, `info@`, `admin@`, `dg@`, `coordo@humanitassante.org`

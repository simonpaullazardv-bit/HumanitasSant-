# Audit final du pack Humanitas Santé — 14 août 2026

## 1. Périmètre

Ce contrôle porte exclusivement sur le ZIP reçu :
`HUMANITAS-V5.1-HARMONISEE-FRONTEND-HYBRIDE-2026-08-14.zip`.

Aucun autre ZIP ou ancienne copie du projet n'a été utilisé pour les corrections.

## 2. Architecture retenue

- Frontend principal : React + TanStack Start + Vite.
- Données métier : Supabase/PostgreSQL + RLS.
- PHP : conservé dans `/backend` comme legacy technique, hors du flux applicatif principal.
- Les fichiers `/database/001..010` restent historiques ; la source de vérité SQL est `/supabase/migrations`.
- Lovable reste présent uniquement là où l'authentification OAuth actuelle en dépend encore. Il n'est pas utilisé comme identité publique du site.
- Les traces Google AI Studio/Gemini ne constituent plus une capacité publique du site.

## 3. Correction majeure : vitrine hybride

Le site ne dépend plus d'une galerie ou d'un CMS Supabase rempli pour afficher les médias locaux.

Avant `dev` et `build`, `scripts/generate-public-media.mjs` parcourt automatiquement :

- `public/img/**` pour les images ;
- `public/videos/**` pour les vidéos.

Le manifeste généré est `src/data/public-media.generated.ts`.

Au dernier audit, **55 images** ont été indexées et **0 vidéo** était présente dans `public/videos`.

Le principe est :

1. Supabase fournit les contenus publiés lorsqu'ils existent ;
2. les médias de `public/` restent disponibles ;
3. les doublons d'URL sont évités ;
4. une panne ou une base vide ne laisse pas les espaces vitrine sans contenu local ;
5. une nouvelle image ou vidéo déposée dans `public/` sera prise en compte au prochain `npm run dev` ou `npm run build`.

## 4. Direction Générale

La zone DG reste structurée en deux emplacements distincts :

- portrait : `/img/dg.png` ;
- message officiel en image : `/img/messagedg.png`.

Supabase peut remplacer ces références lorsqu'une publication officielle `public_director_general` est validée.

## 5. Galerie

La galerie locale ne filtre pas artificiellement les images par catégorie. Toutes les images indexées dans `public/img/**` peuvent participer au défilement.

La page `/galerie` possède également un espace vidéo. Les vidéos peuvent provenir de Supabase ou de `public/videos/**`.

## 6. Favicon

Le `index.html` et la racine TanStack déclarent :

- `/favicon.ico` ;
- `/favicon-16x16.png` ;
- `/favicon-32x32.png` ;
- `/apple-touch-icon.png` ;
- `/site.webmanifest`.

Les fichiers favicon présents dans le ZIP ont été conservés et ne sont pas remplacés arbitrairement.

## 7. Contacts et identité

Identité publique : `humanitassante.org`.

Contacts institutionnels configurés :

- `contact@humanitassante.org`
- `info@humanitassante.org`
- `admin@humanitassante.org`
- `dg@humanitassante.org`
- `coordo@humanitassante.org`

Téléphones configurés :

- `+243 844 433 025` — contact principal Humanitas Santé ;
- `+243 900 000 000` — second contact déjà demandé dans le projet, à confirmer avant communication officielle si nécessaire.

Adresses :

- `12, PLAZZA, avenue Mavinga, Quartier Bahumbu, Commune de la N'SELE, ville de Kinshasa` ;
- `Victoire — Bâtiment Carrefour des Jeunes`.

## 8. Sécurité / données publiques

Les statistiques publiques ne sont pas remplacées par des chiffres fictifs lorsque Supabase ne fournit aucune statistique validée.

Les établissements et entreprises partenaires ne sont pas pré-remplis avec des noms fictifs. Leur publication doit venir d'une validation Supabase.

Les partenaires institutionnels déjà demandés sont conservés dans la vitrine locale :

- Lumen Pacis Humanitas (LPH) ;
- Rapido ;
- ASBL Mon Ami.

## 9. Contrôles effectués

- Syntaxe PHP du legacy `/backend` : **OK** pour les fichiers PHP présents.
- Génération du manifeste média local : **OK** — 55 images indexées.
- Vérification des références `/img/*` vers les fichiers présents : **OK**.
- Vérification des dimensions des médias principaux : **OK**.
- Installation `npm ci` : non terminée dans l'environnement d'audit (timeout réseau), donc aucun succès de build npm ne doit être prétendu.
- `tsc --noEmit` : bloqué par l'absence de `node_modules` (`vite/client` introuvable). Cela vient de l'environnement d'audit, pas d'une erreur TypeScript démontrée dans le projet.

## 10. Procédure après réception du pack

```bash
npm ci
npm run build
npm run preview
```

Puis, pour le développement :

```bash
npm run dev
```

Le script d'indexation des médias s'exécute automatiquement avant `dev` et `build`.

## 11. Mise en production

Ne jamais mettre une clé Supabase secrète dans `VITE_*`.

- navigateur : `VITE_SUPABASE_URL` + clé publishable/anon ;
- serveur : `SUPABASE_URL` + clé publishable ;
- clé secret/service role : serveur uniquement.

La mise en ligne définitive doit être faite après validation du domaine `humanitassante.org`, des variables d'environnement, de Supabase Auth, des redirections OAuth et des tests RLS sur un environnement de staging.

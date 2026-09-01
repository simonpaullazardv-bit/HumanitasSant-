# HUMANITAS SANTÉ — Harmonisation frontend / vitrine — 14 août 2026

## Changements appliqués

- Identité publique harmonisée autour de `humanitassante.org`.
- Suppression des anciennes références publiques `humanitassante.lovable.app` et `My Google AI Studio App`.
- Intégration correcte des fichiers favicon.io déjà présents dans `public/`.
- `site.webmanifest` complété pour Humanitas Santé.
- Correction des chemins d'images vers les fichiers réellement présents dans `public/img`.
- Galerie locale de `public/img/gallery/` entièrement prise en compte, sans filtrage de catégories.
- Deux espaces galerie : bandeau dynamique du header + galerie principale avec défilement automatique et navigation manuelle.
- Fusion des médias Supabase avec les médias locaux pour les vitrines : Supabase prioritaire, public local en complément/secours.
- Espace vidéo conservé dans `public/videos/`, prêt pour les fichiers locaux puis Supabase Storage.
- Photo DG et message DG préparés en ressources locales ; le message officiel est affiché comme image.
- Catégories Bronze / Argent / Or / Platine disponibles localement en attendant Supabase.
- Message « Adhésion gratuite » et « Carte de membre : 10 USD » ajouté aux zones d'adhésion.
- Coordonnées institutionnelles locales préparées : téléphone principal, téléphone secondaire fourni, emails `contact/info/admin/dg/coordo`, adresse et `Adresse 2 — Victoire — Bâtiment Carrefour des Jeunes`.
- Réseaux sociaux existants référencés dans le projet conservés en secours local.
- Lumen Pacis Humanitas (LPH), Rapido et ASBL Mon Ami ajoutés comme partenaires institutionnels associés, sans les présenter comme établissements de soins conventionnés.
- Les statistiques publiques restent masquées lorsqu'aucune donnée Supabase validée n'est disponible : aucun chiffre inventé n'est introduit.
- Documentation ajoutée sur la stratégie hybride `public/` + Supabase.

## Ce qui reste volontairement conservé

- Les dépendances Lovable ne sont pas supprimées brutalement, car l'authentification actuelle en dépend encore.
- Les traces techniques `.lovable` / AI Studio restent hors de l'identité publique du site et pourront être nettoyées après migration complète de l'authentification et de l'outillage.
- Le backend PHP historique n'est pas supprimé dans cette passe : l'architecture cible sans PHP est conservée comme trajectoire, mais toute suppression doit être précédée d'une vérification des dépendances.

## Validation effectuée

- Syntaxe TypeScript/TSX des fichiers modifiés : parse réussie.
- JSON de `package.json`, `package-lock.json` et `public/site.webmanifest` : valide.
- Vérification des 40 noms de fichiers de la galerie locale : aucun fichier manquant.
- Le build complet n'a pas pu être exécuté dans l'environnement de travail car l'installation npm des dépendances n'a pas terminé dans le délai disponible. Il devra être exécuté dans l'environnement de développement du projet avant déploiement.

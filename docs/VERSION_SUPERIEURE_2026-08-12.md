# HUMANITAS — Version supérieure métier (12/08/2026)

## Principes

Cette version **fait évoluer V4**. Elle ne remplace pas l'historique des migrations et ne demande aucun reset de `humanitasBD`.

- `supabase/migrations/` reste la source de déploiement PostgreSQL.
- `database/*.sql` reste une référence historique et n'est pas exécuté automatiquement.
- Le backend PHP reste legacy et n'est pas réactivé dans le flux frontend Supabase direct.
- Les secrets Supabase ne sont jamais prévus dans le bundle Vite.

## Espaces partenaires

Les établissements de soins sont séparés par rôle applicatif et `partenaire_id` :

- `hopital`
- `pharmacie`
- `laboratoire`
- `centre_bien_etre`

Une entreprise conserve son rôle `entreprise`.

Le cloisonnement est contrôlé en base par `partenaire_role_compatible(user_id, partenaire_id)`. Le frontend ne constitue donc pas la frontière de sécurité.

## Vérification membre

Chaque établissement de soins utilise le même circuit métier :

1. code Humanitas adhérent ou bénéficiaire ;
2. QR code de la carte ;
3. RPC Supabase `partenaire_verifier_code` ;
4. réponse limitée au nécessaire : nom, catégorie, photo si disponible, état de couverture, statut de carte, droits utiles à la prise en charge.

La situation financière détaillée de l'adhérent n'est pas exposée à l'établissement.

## Demande d'adhésion publique

Le formulaire public demande uniquement :

- nom complet ;
- email et/ou téléphone ;
- catégorie d'adhésion.

La boîte interne est lisible par les responsables métier prévus. **Seul le Coordonnateur peut modifier le statut et rédiger la réponse.**

## Finance Direction Générale

Deux RPC en lecture seule sont ajoutées :

- `dg_flux_financier(date, date)`
- `dg_synthese_financiere(date, date)`

Ils s'appuient sur `operations_financieres`, le grand livre immuable. Le dashboard DG peut filtrer une période et voir entrées, sorties, solde et détail des opérations.

## Réseau public

`partenaires.latitude` et `partenaires.longitude` sont disponibles mais restent `NULL` tant que les coordonnées n'ont pas été validées. Les compteurs publics sont calculés à partir des lignes réellement publiées dans Supabase ; aucun nombre de démonstration n'est ajouté.

## Galerie

- Galerie institutionnelle locale : `public/img/gallery/`, rotation aléatoire dans le bandeau public.
- Galerie dynamique : `gallery_images` dans Supabase, administrée par les comptes autorisés et affichée aléatoirement.
- Aucun placeholder institutionnel n'est présenté comme une vraie photographie.

## Avant déploiement

La migration `20260812210000_humanitas_version_superieure_metier.sql` est additive. Elle doit être auditée et testée avant `npx supabase db push`.

Aucune donnée réelle, aucun lien social non validé et aucune statistique publique inventée ne doivent être ajoutés par cette version.

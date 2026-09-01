# HUMANITAS — Direction Générale et publication publique

## 1. Séparation des pouvoirs

`directeur_general` est un rôle PostgreSQL distinct de `super_admin` et `administrateur`.

- **Super Admin** : administration technique, utilisateurs, rôles, sécurité et configuration.
- **Administrateur** : administration opérationnelle et référentiels.
- **Directeur Général** : pilotage stratégique, supervision et lecture consolidée.

Le rôle DG n'est pas ajouté à `is_admin()`. Il est ajouté à `is_staff()` uniquement pour bénéficier des lectures opérationnelles déjà prévues par les policies, et possède `is_directeur_general()` pour les règles spécifiques.

## 2. Identité métier

Le rôle applicatif ne doit pas être dupliqué par personne ou établissement.

- Adhérent : `role=adherent` + `adherents.id`.
- Bénéficiaire : `role=adherent` + `beneficiaires.id`.
- Hôpital : `role=hopital` + `partenaire_membres.partenaire_id`.
- Entreprise : `role=entreprise` + `partenaire_membres.partenaire_id`.

Le cloisonnement réel reste assuré par PostgreSQL/RLS, pas par le seul frontend.

## 3. Données publiques

Aucune statistique publique n'est créée automatiquement par cette version.

Les clés suivantes sont des emplacements de contenu institutionnel validé dans `public.site_settings` :

- `public_director_general`
- `public_contact`
- `public_address`
- `public_statistics`
- `presentation_content`

Une donnée publique doit être :

1. saisie dans Supabase ;
2. vérifiée par Humanitas ;
3. marquée `is_public=true` ;
4. consommée par le frontend.

Une valeur vide ou non validée n'est jamais remplacée par un faux numéro, une fausse adresse ou une statistique de démonstration.

## 4. Réseau de soins public

`partenaires.is_public=false` par défaut.

Une structure peut donc être active pour les opérations internes tout en restant invisible du site public tant que son nom, adresse, téléphone et statut de conventionnement n'ont pas été validés.

## 5. Galerie

Les visuels du bandeau public sont dans :

`public/img/gallery/`

Le bandeau les fait défiler aléatoirement/automatiquement sans publier de statistiques. Les images peuvent être remplacées par les visuels officiels validés.

## 6. Direction Générale — contenu attendu

Le dashboard DG affiche uniquement des KPI calculés à partir des tables réelles :

- adhérents ;
- bénéficiaires ;
- partenaires ;
- prises en charge ;
- cotisations ;
- factures partenaires ;
- ordres de remboursement ;
- événements d'audit.

En cas d'erreur Supabase, la valeur affichée est `Indisponible`, jamais `0` par défaut.

## 7. Frontend public

Le site ne doit pas afficher de chiffre institutionnel écrit en dur dans `src/data/site.ts`.
Les tarifs et taux d'une catégorie d'adhésion sont affichés uniquement depuis `categories_adhesion`.

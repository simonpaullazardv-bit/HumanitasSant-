# Vérification DBA / Développeur / Design — V3

## DBA

- rôle `directeur_general` ajouté à `app_role` ;
- séparation `is_admin()` / `is_directeur_general()` ;
- `is_staff()` inclut le DG pour les lectures opérationnelles ;
- audit lisible par DG et administration ;
- publication publique explicite via `site_settings.is_public` ;
- publication partenaire explicitement contrôlée par `partenaires.is_public` ;
- aucun seed de statistiques publiques ;
- index sur `partenaires.is_public` ;
- RLS conservé comme autorité finale.

## Développeur

- route `/portail/direction-generale` ;
- configuration de navigation distincte ;
- dashboard DG avec comptages Supabase réels ;
- abonnement Realtime sur les tables utilisées par les KPI ;
- type `UserRole` et enum Supabase mis à jour ;
- route tree mis à jour ;
- backend PHP non utilisé.

## Design

- identité Humanitas conservée ;
- logo animé sur une orbite circulaire dans le header public ;
- horloge Kinshasa dans le header ;
- globe animé avec repère Kinshasa ;
- galerie compacte sous le header, rotation automatique ;
- aucune statistique fictive dans le hero ;
- état vide explicite lorsque les données publiques ne sont pas validées.

## Règle de non-régression

Aucune table métier existante n'est supprimée par ces migrations. Les changements sont additifs ou remplacent explicitement une policy publique trop large. Les anciens fichiers SQL historiques restent présents.

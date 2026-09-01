# Humanitas Wellness Hub — audit et corrections du 12/08/2026

## 1. Décision d'architecture

La branche `supabase/migrations/` est retenue comme **source de vérité de la base actuelle**.

Le dossier `database/` est conservé uniquement comme **ancienne version SQL historique**.

Le frontend actuel utilise principalement le client Supabase directement. Le backend PHP présent dans le dépôt n'est donc pas traité comme une couche obligatoire de l'architecture frontend actuelle.

## 2. État constaté avant correction

- `database/001_tables.sql` : 10 tables principales.
- `src/integrations/supabase/types.ts` : 46 tables déclarées.
- migrations Supabase avant la correction : 58 tables créées au total.
- 8 tables étaient demandées par le frontend mais absentes des migrations :
  - `appointments`
  - `callback_requests`
  - `chat_messages`
  - `contact_messages`
  - `gallery_images`
  - `membership_requests`
  - `site_settings`
  - `notifications` était également demandé par un module, mais a été corrigé côté frontend pour utiliser `notifications_internes`, qui existe déjà et possède ses propres RLS.
- la migration du 11/08 ajoutait plusieurs tables de sécurité/RH avec des politiques trop permissives ou incomplètes.
- le bouton « Sauvegarder mes préférences » du centre de notifications ne persistait pas réellement les préférences.
- `RhBoard` envoyait `departement_id` alors que `personnel` possède actuellement `departement`.

## 3. Corrections appliquées

### Base Supabase

Ajout de :

`supabase/migrations/20260812133000_humanitas_front_public_and_security_fix.sql`

Cette migration :

1. crée les tables publiques manquantes ;
2. ajoute les index nécessaires ;
3. ajoute les triggers `updated_at` ;
4. ajoute les RLS des formulaires publics ;
5. sécurise galerie et paramètres publics ;
6. sécurise les modules RH/sécurité/GED ;
7. ajoute `user_notification_preferences` avec RLS utilisateur ;
8. initialise la clé `presentation_content` de `site_settings`.

### Frontend

- `NotificationsBoard.tsx` utilise maintenant `notifications_internes` au lieu d'une table inexistante `notifications`.
- Le rappel des cotisations appelle la fonction existante `traiter_retards_cotisations_mensuelles()`.
- Les préférences de notification sont enregistrées dans `user_notification_preferences`.
- `RhBoard.tsx` utilise le champ existant `personnel.departement`.

## 4. Ce qui n'est volontairement PAS modifié

- aucune suppression de migration historique ;
- aucune suppression des anciens fichiers `database/*.sql` ;
- aucune modification des règles métier non démontrées par le code existant ;
- aucune clé Supabase réelle ;
- aucun secret ;
- aucune exécution contre un projet Supabase distant ;
- aucun remplacement automatique du backend PHP.

## 5. Point restant avant production

Le fichier `src/integrations/supabase/types.ts` est actuellement un artefact généré correspondant à un état antérieur de la base. Après application des migrations dans un projet Supabase de test, il faut régénérer ce fichier depuis le schéma réel avec l'outil Supabase officiel.

De même, un test d'intégration sur une base Supabase de staging est nécessaire avant toute mise en production.

## 12 août — refonte sans PHP et cloisonnement par identité métier

Ajouts de cette itération :

- décision d'architecture : frontend → Supabase direct, PHP conservé uniquement comme legacy ;
- bénéficiaire doté d'un `user_id`, d'un `code` personnel et d'un espace compte distinct tout en conservant le rôle `adherent` ;
- contexte de compte résolu par `mon_contexte_compte()` ;
- hôpital/entreprise résolus par le `partenaire_id` de `partenaire_membres` ;
- cartes `cartes_membre` étendues au type `beneficiaire` ;
- émission/réimpression de carte bénéficiaire via `emettre_carte_beneficiaire()` ;
- vérification QR publique étendue aux cartes bénéficiaires ;
- vérification partenaire/hôpital par code ou QR avec informations limitées au besoin de prise en charge ;
- prise en charge contrôlée en base : sujet adhérent/bénéficiaire, cohérence titulaire/bénéficiaire, couverture et carte active ;
- RLS étendue au bénéficiaire pour les prises en charge et prestations ;
- Realtime activé pour les tables principales ;
- dashboards adhérent, bénéficiaire, hôpital et entreprise réellement alimentés par Supabase ;
- dashboards internes enrichis par KPI et accès aux modules ;
- suppression du bandeau de carte de démonstration qui fabriquait des numéros de carte côté frontend ;
- préparation `.env.local` et documentation de connexion Supabase.

Migration ajoutée :

`supabase/migrations/20260812150000_humanitas_account_context_realtime.sql`

# HUMANITAS — Audit DBA / Développeur / Analyste / Design — 12/08/2026

## Décision

La V5 est conservée et évolue par migrations additives. `supabase/migrations/` reste la source de vérité; `database/*.sql` reste historique.

Aucune table `membres_couverts`, aucune `carte_membre_couvert` et aucune nouvelle table de partenaire n'est créée pour représenter la couverture entreprise.

La relation métier est :

`partenaires(type='entreprise').id -> adherents.entreprise_id` (nullable).

Un adhérent avec `entreprise_id IS NOT NULL` est un membre couvert/déclaré par cette entreprise.

## Constats structurants

- Le schéma V5 contient 75 créations de tables dans les migrations/fichiers consolidés, dont plusieurs sont `CREATE TABLE IF NOT EXISTS`; le chiffre historique de 65 n'était donc pas une représentation fiable de l'état final du dépôt.
- 83 noms de fonctions uniques sont présents pour 93 définitions, avec plusieurs évolutions `CREATE OR REPLACE` attendues; les doublons ont été identifiés et doivent être lus dans l'ordre des migrations.
- 4 vues sont présentes.
- 80 noms de triggers sont présents pour 82 définitions.
- Le dépôt contient à la fois le SQL historique `database/*.sql` et les migrations Supabase; seule la chaîne des migrations doit être déployée.
- Le rôle `directeur_general` est ajouté dans une migration dédiée avant les migrations qui le référencent.

## QR / token

- `cartes_membre.qr_token` reste la référence de vérification.
- Le QR n'encode pas les données personnelles; il transporte le lien de vérification et le token.
- Le flux de remplacement doit conserver la révocation de l'ancienne carte et la génération d'un nouveau token.
- Les maquettes de cartes ne contiennent plus de faux tokens de démonstration.
- L'URL publique du QR est désormais configurable via `VITE_PUBLIC_SITE_URL`; aucune URL de production n'est inventée.

## Gratification

Ajout de `supabase/migrations/20260812220000_humanitas_gratifications_and_data_hygiene.sql`.

Le module couvre deux sujets :

1. gratification d'un adhérent;
2. gratification d'une entreprise partenaire.

Les décisions sont historisées avec période, statut, montant, motif, critères et validation.

`evaluer_fidelite_adherent()` calcule les métriques réelles à partir des cotisations, prises en charge et remboursements payés. Le candidat de fidélité annuelle exige 12 mois complets et aucune prise en charge; aucun montant de gratification n'est inventé.

`evaluer_fidelite_entreprise()` calcule le nombre réel de membres rattachés et le taux de paiement sur une période. Les seuils spécifiques de gratification d'une entreprise ne sont pas inventés : la décision automatique reste désactivée jusqu'à validation des critères.

## Données publiques

Les partenaires de démonstration historiques restent utilisables pour les tests internes mais sont forcés à `is_public=false`. La publication exige donc une validation explicite.

Les anciennes coordonnées de démonstration de `site_settings` sont vidées. Les vrais réseaux sociaux, téléphone, adresse et e-mail seront renseignés après validation.

## Corrections frontend

- suppression du numéro WhatsApp codé en dur;
- suppression des valeurs de secours fictives IP/géolocalisation dans le journal sécurité;
- suppression du numéro d'urgence fictif dans le visuel de carte;
- suppression des faux tokens dans la maquette d'impression;
- configuration de l'URL publique de vérification QR.

## Points à tester avant `db push`

1. appliquer toutes les migrations sur une base de staging;
2. générer les types Supabase depuis le schéma réel;
3. vérifier toutes les RPC et leurs signatures;
4. tester RLS pour chaque rôle et chaque entreprise/établissement;
5. tester émission, impression, réimpression et révocation de carte;
6. tester QR adhérent et bénéficiaire;
7. tester flux financiers DG;
8. tester gratification adhérent et entreprise;
9. tester demande publique d'adhésion et réponse exclusivement Coordonnateur;
10. tester Realtime;
11. `npm install` puis `npm run build` et tests disponibles;
12. seulement après validation : `npx supabase db push` vers `humanitasBD`.

# HUMANITAS — Architecture cible sans PHP

## Décision

Cette version n'utilise **pas le backend PHP** comme intermédiaire. Le flux cible est :

`Frontend TanStack/React → Supabase Auth → Supabase/PostgreSQL/RLS/Realtime/Storage → Edge Functions si un traitement serveur est nécessaire.`

Le dossier `backend/` est conservé comme archive technique de la génération Gemini précédente. Il n'est pas requis par le portail actuel.

## Principe fondamental des comptes

Le **rôle** est un code applicatif commun. Il ne constitue jamais, à lui seul, l'identité métier.

| Compte | Rôle applicatif | Identifiant privé qui cloisonne le compte |
|---|---|---|
| Adhérent | `adherent` | `adherent_id` |
| Bénéficiaire | `adherent` | `beneficiaire_id` |
| Hôpital | `hopital` | `partenaire_id` vers un partenaire de type établissement de soins |
| Entreprise partenaire | `entreprise` | `partenaire_id` |
| Personnel Humanitas | rôle interne | `user_id` + éventuel `personnel_id` |

Il n'existe volontairement **aucun rôle `beneficiaire`**. Le bénéficiaire utilise le même code de rôle que l'adhérent mais possède son propre compte, son `user_id`, son `beneficiaire_id`, son code personnel et, si émise, sa carte personnelle.

## Cloisonnement

Le cloisonnement réel est effectué par PostgreSQL/RLS. L'interface ne sert qu'à présenter le bon espace.

- Adhérent : uniquement son dossier, ses cotisations, ses paiements, ses bénéficiaires et ses prises en charge.
- Bénéficiaire : uniquement son dossier, sa carte et ses propres prises en charge. Les informations du titulaire sont limitées au strict nécessaire.
- Hôpital : uniquement son établissement, ses contrats, ses prises en charge, ses factures et la vérification des droits.
- Entreprise : uniquement son entreprise, ses collaborateurs couverts et ses documents contractuels ; aucune donnée médicale inutile.
- Staff : accès déterminé par les fonctions RLS et le rôle métier.

## Temps réel

Les tables opérationnelles principales sont ajoutées à `supabase_realtime` : adhérents, bénéficiaires, adhésions, cotisations, paiements, cartes, prises en charge, prestations, partenaires, factures, ordres et notifications.

Le frontend invalide les requêtes du tableau de bord lorsqu'un changement PostgreSQL est reçu.

# Plan de test — version Supabase directe

## Avant déploiement

1. Copier `.env.local.example` vers `.env.local`.
2. Renseigner uniquement la URL Supabase et la clé publishable/anon côté navigateur.
3. Ne jamais mettre `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` exposé au navigateur.
4. Créer un projet Supabase de staging.
5. Appliquer les migrations dans l'ordre.
6. Vérifier la génération des types Supabase après application des migrations.

## Tests d'identité

- création d'un adhérent + compte ;
- création d'un bénéficiaire + compte avec le rôle `adherent` ;
- rattachement d'un compte au bon `beneficiaire_id` ;
- rattachement d'un hôpital au bon `partenaire_id` ;
- rattachement d'une entreprise au bon `partenaire_id` ;
- changement de rôle interdit à un utilisateur normal.

## Tests de cloisonnement

- Adhérent A ne voit jamais Adhérent B.
- Bénéficiaire A ne voit jamais Bénéficiaire B.
- Bénéficiaire ne voit pas les cotisations détaillées du titulaire sauf information explicitement prévue.
- Hôpital A ne voit pas les dossiers internes de l'hôpital B.
- Hôpital ne peut pas choisir arbitrairement un autre `partenaire_id`.
- Entreprise A ne voit pas Entreprise B.
- Un hôpital ne reçoit du contrôle d'éligibilité que les informations nécessaires.

## Tests métier prise en charge

- recherche par code adhérent ;
- recherche par code bénéficiaire ;
- QR adhérent ;
- carte bénéficiaire ;
- refus si carte inactive ;
- refus si couverture inactive ;
- création de PEC pour adhérent ;
- création de PEC pour bénéficiaire ;
- décision médecin conseil ;
- prestation ;
- facture ;
- ordre de remboursement ;
- blocage du double paiement.

## Tests temps réel

Modifier une cotisation, une prise en charge, une notification ou une carte dans Supabase et vérifier que le tableau de bord correspondant se met à jour sans rechargement manuel.

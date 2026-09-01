# HUMANITAS — Contenu cible des tableaux de bord

## 1. Adhérent

- identité et matricule Humanitas ;
- état de la couverture ;
- carte active, numéro, QR et expiration ;
- bénéficiaires actifs ;
- cotisations, échéances, montants payés et reste dû ;
- prises en charge et statuts ;
- remboursements et documents ;
- notifications personnelles ;
- accès temps réel.

Le compte est cloisonné par `adherent_id`.

## 2. Bénéficiaire

- identité du bénéficiaire ;
- code `BEN-AAAA-XXXXXX` ;
- carte personnelle ;
- statut actif/inactif ;
- titulaire auquel il est rattaché, avec informations minimales ;
- propres prises en charge et prestations ;
- notifications personnelles ;
- accès temps réel.

Le compte conserve le rôle `adherent`, mais est distingué par `beneficiaire_id`.

## 3. Hôpital

- identité de l'établissement et numéro partenaire ;
- contrat actif et taux de couverture ;
- compteur de prises en charge ;
- factures et règlements ;
- notifications ;
- **contrôle des droits** par QR ou code Humanitas ;
- recherche d'un adhérent ou d'un bénéficiaire ;
- verdict d'éligibilité ;
- affichage limité aux informations nécessaires à la prise en charge ;
- création d'une demande de prise en charge liée à l'adhérent ou au bénéficiaire ;
- déclaration des prestations ;
- soumission des factures.

Le compte est cloisonné par `partenaire_id` et le rôle `hopital`.

## 4. Entreprise partenaire

- identité de l'entreprise ;
- contrat collectif ;
- nombre de collaborateurs couverts ;
- documents contractuels ;
- cotisations/factures contractuelles ;
- notifications ;
- aucun accès aux informations médicales individuelles non nécessaires.

Le compte est cloisonné par `partenaire_id` et le rôle `entreprise`.

## 5. Administration

- volume des adhérents ;
- partenaires ;
- prises en charge ;
- alertes financières ;
- utilisateurs et rôles ;
- cartes ;
- finance ;
- réseau de soins ;
- RH ;
- GED ;
- audit ;
- rapports ;
- paramètres.

## 6. Coordination

- adhésions en attente ;
- bénéficiaires ;
- cartes ;
- dossiers adhérents ;
- réseau partenaire ;
- relances et renouvellements.

## 7. Médecine conseil

- file des prises en charge ;
- dossiers à revoir ;
- décisions médicales ;
- prestations déclarées ;
- plafonds et cohérence des actes ;
- historique des décisions.

## 8. Finance

- cotisations ;
- impayés ;
- encaissements ;
- factures partenaires ;
- ordres de remboursement ;
- reporting financier ;
- rapprochements et exports.

## 9. Agent Humanitas

- portefeuille d'adhérents ;
- dossiers en attente ;
- bénéficiaires ;
- cartes ;
- enrôlement ;
- suivi terrain et collecte.

## 10. Espaces partenaires de soins distincts — version supérieure

Les espaces suivants sont séparés et chacun est cloisonné par `partenaire_id` + rôle compatible :

- Pharmacie — `/portail/pharmacie`
- Laboratoire — `/portail/laboratoire`
- Centre de bien-être — `/portail/centre-bien-etre`

Ils reprennent le circuit sécurisé de vérification par code/QR, prise en charge, facturation, documents et notifications de leur propre établissement.

## 11. Demandes d'adhésion

Les responsables autorisés disposent d'une boîte de demandes en temps réel. La lecture est disponible pour les profils métier prévus ; seule la fonction `coordonnateur` peut répondre et modifier le statut.

## 12. Direction Générale — flux financier

La Direction Générale dispose d'une lecture consolidée du grand livre financier avec filtre par période et détail des opérations. Les montants proviennent de `operations_financieres` via les RPC sécurisées `dg_flux_financier` et `dg_synthese_financiere`.

# Audit DBA — routines, triggers, vues et appels applicatifs — 2026-08-12

## Périmètre
- Source active : `supabase/migrations/` uniquement.
- `database/006_procedures.sql` et `database/008_views.sql` restent historiques et ne sont pas exécutés par la chaîne Supabase actuelle.
- Frontend : appels `.rpc()` et accès directs aux vues/tables inspectés statiquement.

## Inventaire
- Fonctions SQL dans les migrations actives : **79**
- Vues SQL dans les migrations actives : **4** (`mon_compte, v_balance_comptable, v_grand_livre, v_journal_caisse`)
- Procédures historiques dans `database/006_procedures.sql` : **2** (`sp_cloturer_dossiers_remboursement, sp_generer_cotisations_mensuelles`)
- Triggers déclarés dans les migrations actives : **81**
- RPC appelés explicitement par le frontend : **19 avant cette correction**, plus `get_journal_caisse`, `get_grand_livre`, `get_balance_comptable` après cette correction.

## RPC frontend — vérification

- `carte_conditions` : **défini dans la chaîne active**
- `emettre_carte` : **défini dans la chaîne active**
- `emettre_carte_beneficiaire` : **défini dans la chaîne active**
- `facture_controler` : **défini dans la chaîne active**
- `get_balance_comptable` : **défini dans la chaîne active**
- `get_grand_livre` : **défini dans la chaîne active**
- `get_journal_caisse` : **défini dans la chaîne active**
- `lier_mon_compte_beneficiaire` : **défini dans la chaîne active**
- `mon_contexte_compte` : **défini dans la chaîne active**
- `ordre_payer` : **défini dans la chaîne active**
- `ordre_valider` : **défini dans la chaîne active**
- `partenaire_verifier_adherent` : **défini dans la chaîne active**
- `partenaire_verifier_code` : **défini dans la chaîne active**
- `pec_decider` : **défini dans la chaîne active**
- `pec_enregistrer_prestations` : **défini dans la chaîne active**
- `plafond_disponible` : **défini dans la chaîne active**
- `traiter_retards` : **défini dans la chaîne active**
- `traiter_retards_cotisations_mensuelles` : **défini dans la chaîne active**
- `verifier_carte` : **défini dans la chaîne active**

## Corrections apportées

- `mon_contexte_compte()` conserve le modèle rôle commun + identifiant métier et rend la sélection d’un contexte déterministe.
- `partenaire_verifier_adherent()` conserve son ancienne signature et délègue au vérificateur canonique, désormais compatible adhérent/bénéficiaire via QR.
- `check_pec_subject()` valide maintenant aussi une `carte_id` explicitement fournie : elle doit appartenir au bon adhérent/bénéficiaire et être active/non expirée.
- `traiter_retards()` et `traiter_retards_cotisations_mensuelles()` exigent désormais le rôle financier/admin avant toute modification financière.
- Les vues comptables ne sont plus directement accordées à tous les utilisateurs authentifiés ; trois RPC contrôlés les remplacent pour le frontend Finance.
- Les fonctions sensibles ont été retirées de l’exécution PUBLIC/anon lorsque cela est nécessaire. La vérification de carte par token reste explicitement disponible à `anon` et `authenticated`.
- Les clients Supabase utilisent désormais une seule configuration Vite côté navigateur et une clé secrète uniquement côté serveur.
- Le répertoire public des partenaires filtre explicitement `is_public=true` en plus du RLS.

## Procédures historiques

Les deux procédures de `database/006_procedures.sql` (`sp_generer_cotisations_mensuelles`, `sp_cloturer_dossiers_remboursement`) ne sont pas appelées par le frontend actuel et ne sont pas incluses dans les migrations Supabase actives. Elles ne doivent donc pas être exécutées parallèlement aux fonctions modernes, afin d’éviter deux moteurs métier concurrents. La logique active est portée par les fonctions/mutations présentes dans `supabase/migrations/`.

## Règle de validation avant production

Cette revue est statique. La validation finale doit être faite sur `humanitasBD` en staging avec introspection PostgreSQL, tests RLS par rôle, tests de transitions de statut, tests de contraintes et `npm run lint && npm run build`. Aucun résultat de cette archive ne doit être interprété comme une preuve de validation sur la base distante tant que ces tests n’ont pas été exécutés.

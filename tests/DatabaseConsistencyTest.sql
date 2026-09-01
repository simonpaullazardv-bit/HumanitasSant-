-- HUMANITAS — assertions SQL à exécuter dans humanitasBD après application
-- des migrations. Ce fichier ne modifie aucune donnée.

-- 1. Rôles critiques
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'app_role'
  AND enumlabel IN ('super_admin','administrateur','directeur_general','adherent','hopital','entreprise');

-- 2. Routines critiques présentes
SELECT n.nspname AS schema_name, p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'mon_contexte_compte','partenaire_verifier_code','partenaire_verifier_adherent',
    'check_pec_subject','emettre_carte_beneficiaire','verifier_carte',
    'can_view_finance','get_journal_caisse','get_grand_livre','get_balance_comptable'
  )
ORDER BY p.proname;

-- 3. Triggers métier critiques
SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trg_pec_subject','trg_pec_contrat','trg_pec_numero','trg_pec_notify','trg_pec_notify_medecin')
ORDER BY event_object_table, trigger_name;

-- 4. Vues comptables présentes
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('v_journal_caisse','v_grand_livre','v_balance_comptable','mon_compte')
ORDER BY table_name;

-- 5. Vérifier les politiques RLS des tables d'identité métier
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('adherents','beneficiaires','cartes_membre','partenaire_membres','prises_en_charge')
ORDER BY tablename, policyname;

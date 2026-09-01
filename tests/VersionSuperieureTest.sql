-- HUMANITAS — contrôles post-déploiement de la version supérieure
-- Lecture seule. À exécuter dans humanitasBD uniquement après db push.

-- 1. Rôles partenaires distincts
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'app_role'
  AND enumlabel IN ('hopital','pharmacie','laboratoire','centre_bien_etre','entreprise')
ORDER BY enumlabel;

-- 2. Géolocalisation : contraintes et colonnes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'partenaires'
  AND column_name IN ('latitude','longitude');

-- 3. Cloisonnement partenaire
SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('partenaire_role_compatible','partenaire_verifier_code')
ORDER BY proname;

-- 4. Demandes d'adhésion : seules les policies prévues doivent permettre
-- la lecture staff et la modification Coordonnateur.
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'membership_requests'
ORDER BY policyname, cmd;

-- 5. Flux DG
SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('dg_flux_financier','dg_synthese_financiere')
ORDER BY proname;

-- 6. GED privée
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'documents_humanitas';

SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'ged_storage_%'
ORDER BY policyname;

-- 7. Realtime métier
SELECT pubname, schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('membership_requests','gallery_images','operations_financieres','factures_partenaires','partenaire_notifications')
ORDER BY tablename;

-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 004_foreign_keys.sql (Définition des Clés Étrangères et Relations)
-- ============================================================================

-- Les clés étrangères principales ont été déclarées lors de la création des tables dans 001_tables.sql
-- Ce fichier garantit la bonne cohérence des règles ON DELETE et des déclencheurs d'action.

-- Relation profiles -> auth.users
-- ON DELETE CASCADE configuré dans 001_tables.sql

-- Relation adherents -> profiles
-- ON DELETE CASCADE configuré dans 001_tables.sql

-- Relation ayants_droit -> adherents
-- ON DELETE CASCADE configuré dans 001_tables.sql

-- Relation cotisations -> adherents
-- ON DELETE CASCADE configuré dans 001_tables.sql

-- Relation demandes_remboursement -> adherents
-- ON DELETE CASCADE configuré dans 001_tables.sql

-- Relation demandes_remboursement -> partenaires
-- ON DELETE SET NULL configuré dans 001_tables.sql

-- Relation cartes_sante -> adherents
-- ON DELETE CASCADE configuré dans 001_tables.sql

COMMENT ON TABLE public.profiles IS 'Utilisateurs du système synchronisés avec Supabase Auth';
COMMENT ON TABLE public.adherents IS 'Dossiers des adhérents de la mutuelle Humanitas Santé';
COMMENT ON TABLE public.cotisations IS 'Suivi des cotisations et reçus de paiement';
COMMENT ON TABLE public.demandes_remboursement IS 'Demandes de prises en charge et remboursements de soins';
COMMENT ON TABLE public.partenaires IS 'Réseau d écosystème médical et bien-être conventionné';

-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 003_indexes.sql (Indexation pour Performances Optimales)
-- ============================================================================

-- Indexation des profils utilisateurs
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Indexation des adhérents
CREATE INDEX IF NOT EXISTS idx_adherents_user_id ON public.adherents(user_id);
CREATE INDEX IF NOT EXISTS idx_adherents_num_adherent ON public.adherents(numero_adherent);
CREATE INDEX IF NOT EXISTS idx_adherents_statut ON public.adherents(statut);
CREATE INDEX IF NOT EXISTS idx_adherents_formule ON public.adherents(formule);

-- Indexation des ayants droit
CREATE INDEX IF NOT EXISTS idx_ayants_droit_adherent_id ON public.ayants_droit(adherent_id);

-- Indexation des partenaires
CREATE INDEX IF NOT EXISTS idx_partenaires_ville ON public.partenaires(ville);
CREATE INDEX IF NOT EXISTS idx_partenaires_type ON public.partenaires(type_etablissement);
CREATE INDEX IF NOT EXISTS idx_partenaires_conventionne ON public.partenaires(est_conventionne);

-- Indexation des cotisations
CREATE INDEX IF NOT EXISTS idx_cotisations_adherent_id ON public.cotisations(adherent_id);
CREATE INDEX IF NOT EXISTS idx_cotisations_statut ON public.cotisations(statut);
CREATE INDEX IF NOT EXISTS idx_cotisations_periode ON public.cotisations(periode);

-- Indexation des demandes de remboursement
CREATE INDEX IF NOT EXISTS idx_remboursements_adherent_id ON public.demandes_remboursement(adherent_id);
CREATE INDEX IF NOT EXISTS idx_remboursements_partenaire_id ON public.demandes_remboursement(partenaire_id);
CREATE INDEX IF NOT EXISTS idx_remboursements_statut ON public.demandes_remboursement(statut);
CREATE INDEX IF NOT EXISTS idx_remboursements_date_soin ON public.demandes_remboursement(date_soin);

-- Indexation des cartes de santé
CREATE INDEX IF NOT EXISTS idx_cartes_adherent_id ON public.cartes_sante(adherent_id);
CREATE INDEX IF NOT EXISTS idx_cartes_numero ON public.cartes_sante(numero_carte);

-- Indexation des rendez-vous & réclamations
CREATE INDEX IF NOT EXISTS idx_rdv_adherent_date ON public.rendez_vous(adherent_id, date_heure);
CREATE INDEX IF NOT EXISTS idx_reclamations_user_statut ON public.reclamations(user_id, statut);
CREATE INDEX IF NOT EXISTS idx_audit_user_action ON public.audit_logs(user_id, action);

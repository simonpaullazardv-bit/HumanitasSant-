-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 002_constraints.sql (Contraintes de Validation et Règles d'Integrité)
-- ============================================================================

-- Contraintes sur les montants de cotisations
ALTER TABLE public.cotisations 
    ADD CONSTRAINT chk_cotisation_montant_positif CHECK (montant > 0);

-- Contraintes sur les montants de demandes de remboursement
ALTER TABLE public.demandes_remboursement 
    ADD CONSTRAINT chk_montant_facture_positif CHECK (montant_facture >= 0),
    ADD CONSTRAINT chk_montant_couvert_coherent CHECK (montant_couvert <= montant_facture),
    ADD CONSTRAINT chk_calcul_reste_charge CHECK (montant_reste_charge = (montant_facture - montant_couvert));

-- Contraintes sur les partenaires
ALTER TABLE public.partenaires 
    ADD CONSTRAINT chk_taux_conventionne_valide CHECK (taux_conventionne >= 0 AND taux_conventionne <= 100),
    ADD CONSTRAINT chk_note_qualite_range CHECK (note_qualite >= 0 AND note_qualite <= 5);

-- Contraintes sur les adhérents
ALTER TABLE public.adherents
    ADD CONSTRAINT chk_date_fin_apres_debut CHECK (date_fin_adhesion IS NULL OR date_fin_adhesion >= date_debut_adhesion);

-- Contraintes sur la table des cartes santé
ALTER TABLE public.cartes_sante
    ADD CONSTRAINT chk_date_expiration_carte CHECK (date_expiration > date_emission);

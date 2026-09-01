-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 006_procedures.sql (Procédures Stockées pour Opérations Batch)
-- ============================================================================

-- 1. Procédure pour générer automatiquement les cotisations du mois pour tous les adhérents actifs
CREATE OR REPLACE PROCEDURE public.sp_generer_cotisations_mensuelles(
    IN p_periode VARCHAR(20) -- Format: '2026-08'
)
LANGUAGE plpgsql
AS $$
DECLARE
    r_adherent RECORD;
    v_montant NUMERIC(12,2);
    v_ref TEXT;
BEGIN
    FOR r_adherent IN 
        SELECT id, formule FROM public.adherents WHERE statut = 'actif'
    LOOP
        -- Détermination du tarif de la cotisation selon la formule
        CASE r_adherent.formule
            WHEN 'essential' THEN v_montant := 15000.00;
            WHEN 'confort' THEN v_montant := 25000.00;
            WHEN 'serenite' THEN v_montant := 45000.00;
            WHEN 'excellence' THEN v_montant := 75000.00;
            ELSE v_montant := 25000.00;
        END CASE;

        v_ref := 'FAC-' || p_periode || '-' || SUBSTRING(r_adherent.id::TEXT FROM 1 FOR 8);

        -- Insertion si non existant
        IF NOT EXISTS (
            SELECT 1 FROM public.cotisations 
            WHERE adherent_id = r_adherent.id AND periode = p_periode
        ) THEN
            INSERT INTO public.cotisations (
                adherent_id, reference_facture, periode, montant, date_echeance, statut
            ) VALUES (
                r_adherent.id, v_ref, p_periode, v_montant, CURRENT_DATE + INTERVAL '10 days', 'en_attente'
            );
        END IF;
    END LOOP;
END;
$$;

-- 2. Procédure de clôture des demandes de remboursement traitées
CREATE OR REPLACE PROCEDURE public.sp_cloturer_dossiers_remboursement()
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.demandes_remboursement
    SET statut = 'paye',
        updated_at = NOW()
    WHERE statut = 'approuve' 
      AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

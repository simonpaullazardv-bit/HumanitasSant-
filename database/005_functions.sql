-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 005_functions.sql (Fonctions Métier PL/pgSQL)
-- ============================================================================

-- 1. Fonction pour générer un numéro d'adhérent unique
CREATE OR REPLACE FUNCTION public.fn_generate_numero_adherent()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_prefix TEXT := 'HUM-';
    v_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_sequence INT;
    v_result TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_adherent FROM 10) AS INT)), 1000) + 1
    INTO v_sequence
    FROM public.adherents
    WHERE numero_adherent LIKE v_prefix || v_year || '-%';

    v_result := v_prefix || v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');
    RETURN v_result;
END;
$$;

-- 2. Fonction pour calculer le taux de couverture en fonction de la formule choisie
CREATE OR REPLACE FUNCTION public.fn_calculer_taux_couverture(
    p_formule formule_sante,
    p_type_prestation type_prestation
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
    CASE p_formule
        WHEN 'essential' THEN
            RETURN 70.00;
        WHEN 'confort' THEN
            IF p_type_prestation IN ('hospitalisation', 'maternite') THEN
                RETURN 85.00;
            ELSE
                RETURN 80.00;
            END IF;
        WHEN 'serenite' THEN
            RETURN 90.00;
        WHEN 'excellence' THEN
            RETURN 100.00;
        ELSE
            RETURN 70.00;
    END CASE;
END;
$$;

-- 3. Fonction pour vérifier la validité de la carte de santé d'un adhérent
CREATE OR REPLACE FUNCTION public.fn_verifier_carte_sante(
    p_numero_carte VARCHAR
)
RETURNS TABLE (
    est_valide BOOLEAN,
    nom_adherent TEXT,
    formule_nom TEXT,
    statut_adhesion TEXT,
    date_expiration DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (cs.est_active AND cs.date_expiration >= CURRENT_DATE AND a.statut = 'actif') AS est_valide,
        (p.nom || ' ' || p.prenom)::TEXT AS nom_adherent,
        a.formule::TEXT AS formule_nom,
        a.statut::TEXT AS statut_adhesion,
        cs.date_expiration
    FROM public.cartes_sante cs
    JOIN public.adherents a ON a.id = cs.adherent_id
    JOIN public.profiles p ON p.id = a.user_id
    WHERE cs.numero_carte = p_numero_carte;
END;
$$;

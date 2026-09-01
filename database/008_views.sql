-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 008_views.sql (Vues Analytiques et Reporting)
-- ============================================================================

-- 1. Vue d'ensemble des Adhérents Actifs
CREATE OR REPLACE VIEW public.v_adherents_actifs AS
SELECT 
    a.id AS adherent_id,
    a.numero_adherent,
    p.nom,
    p.prenom,
    p.email,
    p.telephone,
    p.ville,
    a.formule,
    a.statut,
    a.date_debut_adhesion,
    cs.numero_carte,
    cs.date_expiration AS carte_echeance,
    (SELECT COUNT(*) FROM public.ayants_droit ad WHERE ad.adherent_id = a.id) AS nombre_ayants_droit
FROM public.adherents a
JOIN public.profiles p ON p.id = a.user_id
LEFT JOIN public.cartes_sante cs ON cs.adherent_id = a.id
WHERE a.statut = 'actif';

-- 2. Vue Synthèse Financière des Cotisations
CREATE OR REPLACE VIEW public.v_stats_cotisations AS
SELECT 
    periode,
    COUNT(*) AS total_factures,
    SUM(CASE WHEN statut = 'paye' THEN montant ELSE 0 END) AS total_encaisse,
    SUM(CASE WHEN statut = 'en_attente' THEN montant ELSE 0 END) AS total_en_attente,
    SUM(CASE WHEN statut = 'retard' THEN montant ELSE 0 END) AS total_impaye
FROM public.cotisations
GROUP BY periode
ORDER BY periode DESC;

-- 3. Vue Réseau des Partenaires de Santé et Taux de Remboursement
CREATE OR REPLACE VIEW public.v_reseau_prestataires AS
SELECT 
    p.id AS partenaire_id,
    p.nom_etablissement,
    p.type_etablissement,
    p.ville,
    p.telephone,
    p.taux_conventionne,
    p.note_qualite,
    COUNT(dr.id) AS nombre_interventions,
    COALESCE(SUM(dr.montant_couvert), 0) AS volume_pris_en_charge
FROM public.partenaires p
LEFT JOIN public.demandes_remboursement dr ON dr.partenaire_id = p.id
WHERE p.est_conventionne = TRUE
GROUP BY p.id, p.nom_etablissement, p.type_etablissement, p.ville, p.telephone, p.taux_conventionne, p.note_qualite;

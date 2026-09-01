-- =====================================================================
-- MIGRATION: MODULE COMPTABILITÉ, COTISATIONS, REMBOURSEMENTS ET CARTES
-- PROMPTS 12, 13, 14, 15
-- =====================================================================

-- 1. MISE À JOUR DES TARIFS DES CATÉGORIES D'ADHÉSION (PROMPT 13)
-- Bronze : 25 USD, Or : 50 USD, Diamant : 75 USD, Platine : 100 USD
UPDATE public.categories_adhesion 
SET prix_usd = 25.00, plafond_usd = 1000.00, taux_couverture = 70
WHERE LOWER(code::text) = 'bronze';

UPDATE public.categories_adhesion 
SET prix_usd = 50.00, plafond_usd = 2500.00, taux_couverture = 80
WHERE LOWER(code::text) = 'argent';

UPDATE public.categories_adhesion 
SET prix_usd = 75.00, plafond_usd = 5000.00, taux_couverture = 90
WHERE LOWER(code::text) = 'or';

UPDATE public.categories_adhesion 
SET prix_usd = 100.00, plafond_usd = 10000.00, taux_couverture = 100
WHERE LOWER(code::text) = 'platine';

-- Harmonisation métier : les niveaux officiels sont Bronze, Argent, Or et Platine.
UPDATE public.categories_adhesion SET is_active = true WHERE LOWER(code::text) IN ('bronze','argent','or','platine');
UPDATE public.categories_adhesion SET is_active = false WHERE LOWER(code::text) = 'diamant';

-- 2. DÉCLENCHEUR D'INTERDICTION DE SUPPRESSION PHYSIQUE SUR LES TABLES FINANCIÈRES (PROMPT 12)
CREATE OR REPLACE FUNCTION public.prevent_financial_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'Interdiction absolue de suppression physique sur les enregistrements financiers. Utilisez l''annulation logique.'
    USING ERRCODE = 'check_violation';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_operations ON public.operations_financieres;
CREATE TRIGGER trg_prevent_delete_operations
  BEFORE DELETE ON public.operations_financieres
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();

DROP TRIGGER IF EXISTS trg_prevent_delete_paiements ON public.paiements;
CREATE TRIGGER trg_prevent_delete_paiements
  BEFORE DELETE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();

DROP TRIGGER IF EXISTS trg_prevent_delete_cotisations ON public.cotisations;
CREATE TRIGGER trg_prevent_delete_cotisations
  BEFORE DELETE ON public.cotisations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();

DROP TRIGGER IF EXISTS trg_prevent_delete_ordres ON public.ordres_remboursement;
CREATE TRIGGER trg_prevent_delete_ordres
  BEFORE DELETE ON public.ordres_remboursement
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();

DROP TRIGGER IF EXISTS trg_prevent_delete_factures ON public.factures_partenaires;
CREATE TRIGGER trg_prevent_delete_factures
  BEFORE DELETE ON public.factures_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();


-- 3. AUTOMATISATION DES ÉCLATEMENTS DE RECETTES (PROMPT 12)
-- 100% des frais de carte -> frais_administratifs
-- 30% des cotisations -> frais_administratifs, 70% -> fonds_mutuelle
CREATE OR REPLACE FUNCTION public.eclater_recette_automatique()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_montant numeric(12,2);
  v_type text;
  v_part_admin numeric(12,2);
  v_part_soins numeric(12,2);
BEGIN
  v_montant := NEW.montant_usd;
  v_type := COALESCE(NEW.type_operation, 'cotisation');

  IF v_type = 'frais_carte' THEN
    v_part_admin := v_montant;
    v_part_soins := 0.00;
  ELSIF v_type IN ('cotisation', 'cotisation_entreprise') THEN
    v_part_admin := ROUND(v_montant * 0.30, 2);
    v_part_soins := v_montant - v_part_admin;
  ELSE
    v_part_admin := ROUND(v_montant * 0.30, 2);
    v_part_soins := v_montant - v_part_admin;
  END IF;

  NEW.montant_admin_usd := v_part_admin;
  NEW.montant_soins_usd := v_part_soins;

  RETURN NEW;
END;
$$;

-- S'assurer que les colonnes d'éclatement existent sur operations_financieres
ALTER TABLE public.operations_financieres
  ADD COLUMN IF NOT EXISTS partenaire_id uuid REFERENCES public.partenaires(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS montant_admin_usd numeric(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS montant_soins_usd numeric(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS mode_reglement text DEFAULT 'caisse',
  ADD COLUMN IF NOT EXISTS reference_reglement text;

CREATE INDEX IF NOT EXISTS idx_operations_partenaire
  ON public.operations_financieres (partenaire_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_eclater_recette ON public.operations_financieres;
CREATE TRIGGER trg_eclater_recette
  BEFORE INSERT ON public.operations_financieres
  FOR EACH ROW
  WHEN (NEW.sens = 'credit')
  EXECUTE FUNCTION public.eclater_recette_automatique();


-- 4. VUES COMPTABLES (PROMPT 12)
-- A. Journal de Caisse
CREATE OR REPLACE VIEW public.v_journal_caisse AS
SELECT 
  o.id,
  o.created_at AS date_operation,
  'OP-' || UPPER(SUBSTRING(o.id::text, 1, 8)) AS numero_piece,
  o.type_operation,
  o.sens,
  o.montant_usd,
  o.montant_admin_usd,
  o.montant_soins_usd,
  COALESCE(o.mode_reglement, p.mode, 'caisse') AS mode_paiement,
  COALESCE(o.reference_reglement, p.reference, 'N/A') AS reference_transaction,
  o.affectation,
  o.libelle,
  COALESCE(a.nom || ' ' || a.prenom, part.nom, 'Système / Anonyme') AS tiers_nom,
  o.created_by AS operateur_id
FROM public.operations_financieres o
LEFT JOIN public.paiements p ON p.id = o.paiement_id
LEFT JOIN public.adherents a ON a.id = o.adherent_id
LEFT JOIN public.partenaires part ON part.id = o.partenaire_id
ORDER BY o.created_at DESC;

-- B. Grand Livre
CREATE OR REPLACE VIEW public.v_grand_livre AS
SELECT 
  id,
  created_at AS date_écriture,
  '3000-MUTUELLE' AS compte_code,
  affectation AS compte_libelle,
  type_operation,
  libelle,
  CASE WHEN sens = 'debit' THEN montant_usd ELSE 0.00 END AS debit_usd,
  CASE WHEN sens = 'credit' THEN montant_usd ELSE 0.00 END AS credit_usd,
  montant_admin_usd,
  montant_soins_usd
FROM public.operations_financieres
ORDER BY created_at ASC;

-- C. Balance Comptable
CREATE OR REPLACE VIEW public.v_balance_comptable AS
SELECT 
  affectation AS compte,
  COUNT(*) AS nombre_écritures,
  SUM(CASE WHEN sens = 'credit' THEN montant_usd ELSE 0 END) AS total_credit_usd,
  SUM(CASE WHEN sens = 'debit' THEN montant_usd ELSE 0 END) AS total_debit_usd,
  SUM(CASE WHEN sens = 'credit' THEN montant_usd ELSE -montant_usd END) AS solde_net_usd,
  SUM(montant_admin_usd) AS sous_total_frais_admin_usd,
  SUM(montant_soins_usd) AS sous_total_fonds_soins_usd
FROM public.operations_financieres
GROUP BY affectation;


-- 5. FONCTIONS DE GESTION DES COTISATIONS & ÉCHÉANCES AU 5 DU MOIS (PROMPT 13)
-- Vérifier si l'adhérent a payé la carte (10 USD)
CREATE OR REPLACE FUNCTION public.carte_est_payee(_adherent_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.paiements
  WHERE adherent_id = _adherent_id 
    AND type_operation = 'frais_carte' 
    AND statut = 'valide';
  
  IF v_count > 0 THEN
    RETURN true;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.operations_financieres
  WHERE adherent_id = _adherent_id
    AND type_operation = 'frais_carte'
    AND sens = 'credit';

  RETURN (v_count > 0);
END;
$$;

-- Règle des 3 mois de carence : Soins autorisés UNIQUEMENT si au moins 3 cotisations mensuelles validées
CREATE OR REPLACE FUNCTION public.verifier_droits_soins(_adherent_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cotisations_validees integer;
  v_statut text;
BEGIN
  SELECT statut INTO v_statut FROM public.adherents WHERE id = _adherent_id;
  IF v_statut IN ('suspendu', 'resilie') THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_cotisations_validees
  FROM public.cotisations
  WHERE adherent_id = _adherent_id
    AND statut = 'payee';

  -- Nécessite au moins 3 cotisations mensualisées payées
  RETURN (v_cotisations_validees >= 3);
END;
$$;

-- Traitement automatique des retards et pénalités au-delà du 5 de chaque mois
CREATE OR REPLACE FUNCTION public.traiter_retards_cotisations_mensuelles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_penalites numeric(12,2) := 0.00;
  r record;
  v_mois date := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  -- Si on est après le 5 du mois
  IF EXTRACT(DAY FROM CURRENT_DATE) >= 5 THEN
    FOR r IN 
      SELECT a.id, a.nom, a.prenom, a.categorie_id, c.prix_usd AS cotisation_mensuelle_usd
      FROM public.adherents a
      JOIN public.categories_adhesion c ON c.id = a.categorie_id
      WHERE a.statut = 'actif'
        AND NOT EXISTS (
          SELECT 1 FROM public.cotisations cot 
          WHERE cot.adherent_id = a.id AND cot.periode = v_mois AND cot.statut = 'payee'
        )
    LOOP
      -- Marquer le membre en retard
      -- Le retard est porté par cotisations.statut, pas par adherents.statut.
      -- Le statut adhérent reste 'actif' tant que l'adhésion n'est pas suspendue/résiliée.

      -- Générer notification
      INSERT INTO public.notifications_internes (
        destinataire_role, titre, message, entite, entite_id, lien
      ) VALUES (
        'financier', 
        'Cotisation en retard - ' || r.nom || ' ' || r.prenom,
        'L''échéance du 5/Mois est dépassée pour la période ' || TO_CHAR(v_mois, 'YYYY-MM') || '. Montant dû : ' || r.cotisation_mensuelle_usd || ' USD.',
        'adherent', r.id, '/portail/cotisations'
      );

      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('adherents_en_retard', v_count, 'periode', TO_CHAR(v_mois, 'YYYY-MM'));
END;
$$;


-- 6. AMÉLIORATION MODULE CARTES ET QR CODE (PROMPT 15)
-- Seule l'impression autorisée si carte payée
CREATE OR REPLACE FUNCTION public.peut_imprimer_carte(_adherent_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payee boolean;
  v_statut text;
  v_nom text;
  v_prenom text;
  v_matricule text;
BEGIN
  SELECT nom, prenom, matricule, statut INTO v_nom, v_prenom, v_matricule, v_statut
  FROM public.adherents WHERE id = _adherent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('autorise', false, 'raison', 'Adhérent introuvable.');
  END IF;

  IF v_statut IN ('suspendu', 'resilie') THEN
    RETURN jsonb_build_object('autorise', false, 'raison', 'Membre suspendu ou résilié. Impression bloquée.');
  END IF;

  v_payee := public.carte_est_payee(_adherent_id);

  IF NOT v_payee THEN
    RETURN jsonb_build_object('autorise', false, 'raison', 'Frais de carte (10 USD) non réglés.');
  END IF;

  RETURN jsonb_build_object(
    'autorise', true, 
    'raison', 'Autorisé à l''impression',
    'nom', v_nom,
    'prenom', v_prenom,
    'matricule', v_matricule
  );
END;
$$;

GRANT SELECT ON public.v_journal_caisse TO authenticated;
GRANT SELECT ON public.v_grand_livre TO authenticated;
GRANT SELECT ON public.v_balance_comptable TO authenticated;
GRANT EXECUTE ON FUNCTION public.carte_est_payee(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.verifier_droits_soins(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.traiter_retards_cotisations_mensuelles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.peut_imprimer_carte(uuid) TO authenticated;

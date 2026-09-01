-- =========================================================
-- 1. CATEGORIES D'ADHESION : entierement configurables
-- =========================================================
ALTER TABLE public.categories_adhesion ALTER COLUMN code TYPE text;
ALTER TABLE public.categories_adhesion
  ADD COLUMN IF NOT EXISTS prestations_autorisees jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS devise text NOT NULL DEFAULT 'USD';

UPDATE public.categories_adhesion SET
  prix_usd = 25, taux_couverture = 25, plafond_usd = 1000,
  tagline = 'Formule essentielle',
  prestations_autorisees = '["consultation","soins_de_base","medicaments_essentiels"]'::jsonb,
  conditions = '{"mensualites_carence":3,"beneficiaires_max":4}'::jsonb,
  ordre = 1, is_active = true
WHERE code = 'bronze';

UPDATE public.categories_adhesion SET is_active = false WHERE code = 'argent';

UPDATE public.categories_adhesion SET
  prix_usd = 50, taux_couverture = 50, plafond_usd = 2500,
  tagline = 'Bronze + examens',
  prestations_autorisees = '["consultation","soins_de_base","medicaments_essentiels","examens"]'::jsonb,
  conditions = '{"mensualites_carence":3,"beneficiaires_max":4}'::jsonb,
  ordre = 2, is_active = true
WHERE code = 'or';

INSERT INTO public.categories_adhesion
  (code, nom, prix_usd, periode, tagline, description, plafond_usd, taux_couverture,
   avantages, prestations_autorisees, conditions, ordre, mise_en_avant, is_active)
VALUES
  ('diamant', 'Diamant', 75, 'mois', 'Or + laboratoire et hospitalisation',
   'Prise en charge etendue incluant le laboratoire et l''hospitalisation selon les regles.',
   5000, 75,
   '["Consultation","Soins de base","Medicaments essentiels","Examens","Laboratoire","Hospitalisation"]'::jsonb,
   '["consultation","soins_de_base","medicaments_essentiels","examens","laboratoire","hospitalisation"]'::jsonb,
   '{"mensualites_carence":3,"beneficiaires_max":4}'::jsonb,
   3, true, true)
ON CONFLICT DO NOTHING;

UPDATE public.categories_adhesion SET
  prix_usd = 100, taux_couverture = 100, plafond_usd = 10000,
  tagline = 'Couverture complete',
  prestations_autorisees = '["consultation","soins_de_base","medicaments_essentiels","examens","laboratoire","hospitalisation","ambulance"]'::jsonb,
  conditions = '{"mensualites_carence":3,"beneficiaires_max":4}'::jsonb,
  ordre = 4, is_active = true
WHERE code = 'platine';

-- =========================================================
-- 2. MODES DE PAIEMENT : referentiel parametrable
-- =========================================================
CREATE TABLE IF NOT EXISTS public.modes_paiement (
  code text PRIMARY KEY,
  libelle text NOT NULL,
  description text,
  exige_reference boolean NOT NULL DEFAULT true,
  ordre smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modes_paiement TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modes_paiement TO authenticated;
GRANT ALL ON public.modes_paiement TO service_role;
ALTER TABLE public.modes_paiement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modes_paiement_read" ON public.modes_paiement FOR SELECT USING (true);
CREATE POLICY "modes_paiement_manage" ON public.modes_paiement FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_modes_paiement_updated BEFORE UPDATE ON public.modes_paiement
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.modes_paiement (code, libelle, description, exige_reference, ordre) VALUES
  ('BANQUE', 'Banque', 'Virement ou depot bancaire', true, 1),
  ('MOBILE_MONEY', 'Mobile Money', 'Paiement via operateur mobile', true, 2),
  ('CAISSE_AGENCE', 'Caisse agence', 'Encaissement en agence Humanitas', false, 3)
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- 3. PAIEMENTS : champs metier complets
-- =========================================================
ALTER TABLE public.paiements ALTER COLUMN mode DROP DEFAULT;
ALTER TABLE public.paiements ALTER COLUMN mode TYPE text USING (
  CASE mode::text
    WHEN 'virement' THEN 'BANQUE'
    WHEN 'cheque' THEN 'BANQUE'
    WHEN 'carte' THEN 'BANQUE'
    WHEN 'mobile_money' THEN 'MOBILE_MONEY'
    ELSE 'CAISSE_AGENCE' END);
ALTER TABLE public.paiements ALTER COLUMN mode SET DEFAULT 'CAISSE_AGENCE';
ALTER TABLE public.paiements
  ADD CONSTRAINT paiements_mode_fkey FOREIGN KEY (mode) REFERENCES public.modes_paiement(code);

ALTER TABLE public.paiements ALTER COLUMN cotisation_id DROP NOT NULL;
ALTER TABLE public.paiements
  ADD COLUMN IF NOT EXISTS devise text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payeur text,
  ADD COLUMN IF NOT EXISTS periode date,
  ADD COLUMN IF NOT EXISTS type_operation text NOT NULL DEFAULT 'cotisation',
  ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'valide',
  ADD COLUMN IF NOT EXISTS preuve_bucket text,
  ADD COLUMN IF NOT EXISTS preuve_path text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.paiements
  ADD CONSTRAINT paiements_statut_check CHECK (statut IN ('en_attente','valide','rejete','annule')),
  ADD CONSTRAINT paiements_type_check CHECK (type_operation IN ('cotisation','frais_carte','autre')),
  ADD CONSTRAINT paiements_montant_check CHECK (montant_usd > 0);

UPDATE public.paiements p SET periode = c.periode
  FROM public.cotisations c WHERE c.id = p.cotisation_id AND p.periode IS NULL;
UPDATE public.paiements SET reference = 'PAY-LEG-' || left(id::text, 8)
  WHERE reference IS NULL OR btrim(reference) = '';

-- reference unique
CREATE UNIQUE INDEX IF NOT EXISTS paiements_reference_unique ON public.paiements (upper(btrim(reference)));
-- pas de double paiement de cotisation pour une meme periode
CREATE UNIQUE INDEX IF NOT EXISTS paiements_cotisation_periode_unique
  ON public.paiements (adherent_id, periode)
  WHERE type_operation = 'cotisation' AND statut = 'valide' AND periode IS NOT NULL;

CREATE TRIGGER trg_paiements_updated BEFORE UPDATE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- reference auto si absente
CREATE OR REPLACE FUNCTION public.set_paiement_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reference IS NULL OR btrim(NEW.reference) = '' THEN
    NEW.reference := 'PAY-' || to_char(now(), 'YYYYMM') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  IF NEW.type_operation = 'cotisation' AND NEW.periode IS NOT NULL THEN
    NEW.periode := date_trunc('month', NEW.periode)::date;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_paiements_reference BEFORE INSERT ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.set_paiement_reference();

-- =========================================================
-- 4. GRAND LIVRE : operations financieres immuables
-- =========================================================
CREATE TABLE IF NOT EXISTS public.operations_financieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adherent_id uuid REFERENCES public.adherents(id) ON DELETE SET NULL,
  paiement_id uuid REFERENCES public.paiements(id) ON DELETE SET NULL,
  cotisation_id uuid REFERENCES public.cotisations(id) ON DELETE SET NULL,
  type_operation text NOT NULL,
  affectation text NOT NULL CHECK (affectation IN ('fonds_mutuelle','administration')),
  sens text NOT NULL DEFAULT 'credit' CHECK (sens IN ('credit','debit')),
  montant_usd numeric(12,2) NOT NULL,
  devise text NOT NULL DEFAULT 'USD',
  libelle text,
  periode date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_operations_adherent ON public.operations_financieres (adherent_id, created_at DESC);
GRANT SELECT ON public.operations_financieres TO authenticated;
GRANT ALL ON public.operations_financieres TO service_role;
ALTER TABLE public.operations_financieres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operations_read" ON public.operations_financieres FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.block_operation_rewrite()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Le grand livre financier est immuable : aucune modification du passe n''est autorisee.';
END; $$;
CREATE TRIGGER trg_operations_immutable BEFORE UPDATE OR DELETE ON public.operations_financieres
  FOR EACH ROW EXECUTE FUNCTION public.block_operation_rewrite();

-- =========================================================
-- 5. SOLDES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.soldes_adherents (
  adherent_id uuid PRIMARY KEY REFERENCES public.adherents(id) ON DELETE CASCADE,
  total_du numeric(12,2) NOT NULL DEFAULT 0,
  total_paye numeric(12,2) NOT NULL DEFAULT 0,
  solde numeric(12,2) NOT NULL DEFAULT 0,
  mensualites_validees integer NOT NULL DEFAULT 0,
  droits_ouverts boolean NOT NULL DEFAULT false,
  derniere_operation timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.soldes_adherents TO authenticated;
GRANT ALL ON public.soldes_adherents TO service_role;
ALTER TABLE public.soldes_adherents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soldes_read" ON public.soldes_adherents FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));

-- =========================================================
-- 6. ALERTES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.alertes_financieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adherent_id uuid NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
  cotisation_id uuid REFERENCES public.cotisations(id) ON DELETE CASCADE,
  type text NOT NULL,
  niveau text NOT NULL DEFAULT 'avertissement' CHECK (niveau IN ('info','avertissement','critique')),
  message text NOT NULL,
  is_traite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS alertes_uniques ON public.alertes_financieres (cotisation_id, type)
  WHERE cotisation_id IS NOT NULL;
GRANT SELECT, UPDATE ON public.alertes_financieres TO authenticated;
GRANT ALL ON public.alertes_financieres TO service_role;
ALTER TABLE public.alertes_financieres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alertes_read" ON public.alertes_financieres FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));
CREATE POLICY "alertes_manage" ON public.alertes_financieres FOR UPDATE TO authenticated
  USING (public.can_manage_finance(auth.uid())) WITH CHECK (public.can_manage_finance(auth.uid()));

-- =========================================================
-- 7. PARAMETRES METIER
-- =========================================================
INSERT INTO public.app_parametres (cle, valeur, categorie, libelle, description, is_public) VALUES
  ('finance.repartition_cotisation', '{"fonds_mutuelle":70,"administration":30}'::jsonb, 'finance',
   'Repartition des cotisations', 'Part du fonds mutuelle et part administration (en %).', false),
  ('finance.repartition_frais_carte', '{"fonds_mutuelle":0,"administration":100}'::jsonb, 'finance',
   'Repartition des frais de carte', '100 % administration.', false),
  ('finance.jour_echeance', '5'::jsonb, 'finance',
   'Jour limite de paiement', 'Jour du mois avant lequel la cotisation doit etre reglee.', true),
  ('finance.mensualites_carence', '3'::jsonb, 'finance',
   'Mensualites de carence', 'Nombre de mensualites validees avant ouverture des droits.', true),
  ('finance.devise', '"USD"'::jsonb, 'finance', 'Devise de reference', NULL, true)
ON CONFLICT (cle) DO NOTHING;

CREATE OR REPLACE FUNCTION public.param_numeric(_cle text, _defaut numeric)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT valeur #>> '{}' FROM public.app_parametres WHERE cle = _cle)::numeric, _defaut);
$$;

-- =========================================================
-- 8. ECHEANCE AUTOMATIQUE SUR LES COTISATIONS
-- =========================================================
ALTER TABLE public.cotisations
  ADD COLUMN IF NOT EXISTS devise text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS categorie_id uuid REFERENCES public.categories_adhesion(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.set_cotisation_echeance()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE jour int;
BEGIN
  NEW.periode := date_trunc('month', NEW.periode)::date;
  IF NEW.echeance IS NULL THEN
    jour := public.param_numeric('finance.jour_echeance', 5)::int;
    NEW.echeance := (NEW.periode + ((jour - 1) || ' days')::interval)::date;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_cotisations_echeance BEFORE INSERT ON public.cotisations
  FOR EACH ROW EXECUTE FUNCTION public.set_cotisation_echeance();

-- =========================================================
-- 9. RECALCUL DU SOLDE ET DES DROITS
-- =========================================================
CREATE OR REPLACE FUNCTION public.recalculer_solde(_adherent_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_du numeric; v_paye numeric; v_mens int; v_carence int;
BEGIN
  IF _adherent_id IS NULL THEN RETURN; END IF;
  SELECT COALESCE(sum(montant_usd), 0) INTO v_du
    FROM public.cotisations WHERE adherent_id = _adherent_id AND statut <> 'annulee';
  SELECT COALESCE(sum(montant_usd), 0) INTO v_paye
    FROM public.paiements
    WHERE adherent_id = _adherent_id AND statut = 'valide' AND type_operation = 'cotisation';
  SELECT count(DISTINCT periode) INTO v_mens
    FROM public.paiements
    WHERE adherent_id = _adherent_id AND statut = 'valide'
      AND type_operation = 'cotisation' AND periode IS NOT NULL;
  v_carence := public.param_numeric('finance.mensualites_carence', 3)::int;

  INSERT INTO public.soldes_adherents
    (adherent_id, total_du, total_paye, solde, mensualites_validees, droits_ouverts, derniere_operation, updated_at)
  VALUES (_adherent_id, v_du, v_paye, v_paye - v_du, v_mens, v_mens >= v_carence, now(), now())
  ON CONFLICT (adherent_id) DO UPDATE SET
    total_du = EXCLUDED.total_du,
    total_paye = EXCLUDED.total_paye,
    solde = EXCLUDED.solde,
    mensualites_validees = EXCLUDED.mensualites_validees,
    droits_ouverts = EXCLUDED.droits_ouverts,
    derniere_operation = now(),
    updated_at = now();
END; $$;

-- Regle d'activation : appliquee cote serveur
CREATE OR REPLACE FUNCTION public.droits_ouverts(_adherent_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT count(DISTINCT periode) FROM public.paiements
      WHERE adherent_id = _adherent_id AND statut = 'valide'
        AND type_operation = 'cotisation' AND periode IS NOT NULL), 0
  ) >= public.param_numeric('finance.mensualites_carence', 3)::int
  AND EXISTS (SELECT 1 FROM public.adherents WHERE id = _adherent_id AND statut = 'actif');
$$;

-- =========================================================
-- 10. VALIDATION D'UN PAIEMENT : repartition + imputation + solde
-- =========================================================
CREATE OR REPLACE FUNCTION public.traiter_paiement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cle text; v_rep jsonb; v_mut numeric; v_adm numeric;
  v_total numeric; v_montant_du numeric;
BEGIN
  IF NEW.statut <> 'valide' THEN
    PERFORM public.recalculer_solde(NEW.adherent_id);
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.statut = 'valide' THEN
    PERFORM public.recalculer_solde(NEW.adherent_id);
    RETURN NEW;
  END IF;

  v_cle := CASE WHEN NEW.type_operation = 'frais_carte'
                THEN 'finance.repartition_frais_carte'
                ELSE 'finance.repartition_cotisation' END;
  SELECT valeur INTO v_rep FROM public.app_parametres WHERE cle = v_cle;
  v_rep := COALESCE(v_rep, '{"fonds_mutuelle":70,"administration":30}'::jsonb);
  v_mut := COALESCE((v_rep ->> 'fonds_mutuelle')::numeric, 0);
  v_adm := COALESCE((v_rep ->> 'administration')::numeric, 0);

  IF v_mut > 0 THEN
    INSERT INTO public.operations_financieres
      (adherent_id, paiement_id, cotisation_id, type_operation, affectation, montant_usd, devise, libelle, periode, created_by)
    VALUES (NEW.adherent_id, NEW.id, NEW.cotisation_id, NEW.type_operation, 'fonds_mutuelle',
            round(NEW.montant_usd * v_mut / 100, 2), NEW.devise,
            'Part fonds mutuelle - ' || NEW.reference, NEW.periode, auth.uid());
  END IF;
  IF v_adm > 0 THEN
    INSERT INTO public.operations_financieres
      (adherent_id, paiement_id, cotisation_id, type_operation, affectation, montant_usd, devise, libelle, periode, created_by)
    VALUES (NEW.adherent_id, NEW.id, NEW.cotisation_id, NEW.type_operation, 'administration',
            round(NEW.montant_usd * v_adm / 100, 2), NEW.devise,
            'Part administration - ' || NEW.reference, NEW.periode, auth.uid());
  END IF;

  IF NEW.cotisation_id IS NOT NULL THEN
    SELECT COALESCE(sum(montant_usd), 0) INTO v_total FROM public.paiements
      WHERE cotisation_id = NEW.cotisation_id AND statut = 'valide';
    SELECT montant_usd INTO v_montant_du FROM public.cotisations WHERE id = NEW.cotisation_id;
    UPDATE public.cotisations SET
      montant_paye = v_total,
      statut = CASE WHEN v_total >= v_montant_du THEN 'payee'::statut_cotisation
                    WHEN v_total > 0 THEN 'partielle'::statut_cotisation
                    ELSE statut END
    WHERE id = NEW.cotisation_id;
  END IF;

  PERFORM public.recalculer_solde(NEW.adherent_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_paiements_traitement AFTER INSERT OR UPDATE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.traiter_paiement();

CREATE OR REPLACE FUNCTION public.cotisation_solde_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalculer_solde(COALESCE(NEW.adherent_id, OLD.adherent_id));
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_cotisations_solde AFTER INSERT OR UPDATE OR DELETE ON public.cotisations
  FOR EACH ROW EXECUTE FUNCTION public.cotisation_solde_sync();

-- Un paiement valide ne peut plus etre reecrit silencieusement
CREATE OR REPLACE FUNCTION public.protect_paiement()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.statut = 'valide' AND (
       NEW.montant_usd IS DISTINCT FROM OLD.montant_usd
    OR NEW.periode IS DISTINCT FROM OLD.periode
    OR NEW.reference IS DISTINCT FROM OLD.reference
    OR NEW.adherent_id IS DISTINCT FROM OLD.adherent_id
    OR NEW.type_operation IS DISTINCT FROM OLD.type_operation) THEN
    RAISE EXCEPTION 'Un paiement valide ne peut pas etre modifie : enregistrez une operation corrective.';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_paiements_protect BEFORE UPDATE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.protect_paiement();

-- =========================================================
-- 11. RETARDS : statut, alerte, historique
-- =========================================================
CREATE OR REPLACE FUNCTION public.traiter_retards()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    SELECT c.* FROM public.cotisations c
    WHERE c.echeance < current_date
      AND c.statut IN ('due','partielle')
  LOOP
    UPDATE public.cotisations SET statut = 'en_retard' WHERE id = r.id;

    INSERT INTO public.alertes_financieres (adherent_id, cotisation_id, type, niveau, message)
    VALUES (r.adherent_id, r.id, 'cotisation_en_retard', 'critique',
      'Cotisation de ' || to_char(r.periode, 'MM/YYYY') || ' impayee apres l''echeance du '
      || to_char(r.echeance, 'DD/MM/YYYY') || '.')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.adherent_historique
      (adherent_id, evenement, ancien_statut, nouveau_statut, details)
    VALUES (r.adherent_id, 'cotisation_en_retard', r.statut::text, 'en_retard',
      jsonb_build_object('cotisation_id', r.id, 'periode', r.periode, 'echeance', r.echeance));

    PERFORM public.recalculer_solde(r.adherent_id);
    n := n + 1;
  END LOOP;
  RETURN n;
END; $$;

-- Initialisation des soldes existants
DO $$
DECLARE a record;
BEGIN
  FOR a IN SELECT id FROM public.adherents LOOP
    PERFORM public.recalculer_solde(a.id);
  END LOOP;
END $$;
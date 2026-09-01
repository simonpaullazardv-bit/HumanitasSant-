-- =====================================================================
-- HUMANITAS — Gratifications + hygiène des données publiques
-- 2026-08-12
--
-- Migration additive. Ne crée ni membres_couverts ni carte_membre_couvert.
-- Un membre couvert par une entreprise reste un adhérent et est identifié
-- par adherents.entreprise_id.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. GRATIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gratifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_gratification TEXT NOT NULL,
  adherent_id UUID REFERENCES public.adherents(id) ON DELETE RESTRICT,
  entreprise_id UUID REFERENCES public.partenaires(id) ON DELETE RESTRICT,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'proposee',
  montant_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  motif TEXT,
  criteres JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculee_le TIMESTAMPTZ,
  validee_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validee_le TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gratifications_type_check
    CHECK (type_gratification IN ('adherent','entreprise')),
  CONSTRAINT gratifications_statut_check
    CHECK (statut IN ('proposee','approuvee','attribuee','rejetee','annulee')),
  CONSTRAINT gratifications_periode_check
    CHECK (periode_fin >= periode_debut),
  CONSTRAINT gratifications_montant_check
    CHECK (montant_usd >= 0),
  CONSTRAINT gratifications_sujet_check
    CHECK (
      (type_gratification = 'adherent' AND adherent_id IS NOT NULL AND entreprise_id IS NULL)
      OR
      (type_gratification = 'entreprise' AND entreprise_id IS NOT NULL AND adherent_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_gratifications_adherent
  ON public.gratifications(adherent_id, periode_fin DESC)
  WHERE adherent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gratifications_entreprise
  ON public.gratifications(entreprise_id, periode_fin DESC)
  WHERE entreprise_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gratifications_statut
  ON public.gratifications(statut, periode_fin DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gratification_adherent_periode
  ON public.gratifications(adherent_id, periode_debut, periode_fin)
  WHERE adherent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_gratification_entreprise_periode
  ON public.gratifications(entreprise_id, periode_debut, periode_fin)
  WHERE entreprise_id IS NOT NULL;

ALTER TABLE public.gratifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.gratifications TO authenticated;
GRANT INSERT, UPDATE ON public.gratifications TO authenticated;
GRANT ALL ON public.gratifications TO service_role;

DROP POLICY IF EXISTS gratifications_staff_read ON public.gratifications;
CREATE POLICY gratifications_staff_read
ON public.gratifications
FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY[
    'coordonnateur'::public.app_role,
    'directeur_general'::public.app_role
  ])
);

DROP POLICY IF EXISTS gratifications_adherent_read ON public.gratifications;
CREATE POLICY gratifications_adherent_read
ON public.gratifications
FOR SELECT TO authenticated
USING (
  adherent_id IS NOT NULL
  AND public.owns_adherent(auth.uid(), adherent_id)
);

DROP POLICY IF EXISTS gratifications_entreprise_read ON public.gratifications;
CREATE POLICY gratifications_entreprise_read
ON public.gratifications
FOR SELECT TO authenticated
USING (
  entreprise_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.partenaire_membres pm
    JOIN public.user_roles ur
      ON ur.user_id = pm.user_id
     AND ur.role = 'entreprise'
    WHERE pm.user_id = auth.uid()
      AND pm.partenaire_id = gratifications.entreprise_id
      AND pm.is_active = true
  )
);

DROP POLICY IF EXISTS gratifications_staff_write ON public.gratifications;
CREATE POLICY gratifications_staff_write
ON public.gratifications
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY[
    'coordonnateur'::public.app_role,
    'directeur_general'::public.app_role
  ])
);

DROP POLICY IF EXISTS gratifications_staff_update ON public.gratifications;
CREATE POLICY gratifications_staff_update
ON public.gratifications
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY[
    'coordonnateur'::public.app_role,
    'directeur_general'::public.app_role
  ])
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY[
    'coordonnateur'::public.app_role,
    'directeur_general'::public.app_role
  ])
);

CREATE TRIGGER trg_gratifications_updated
BEFORE UPDATE ON public.gratifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Une gratification entreprise n'est possible que pour une ligne de type entreprise.
CREATE OR REPLACE FUNCTION public.check_gratification_entreprise_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.entreprise_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.partenaires p
       WHERE p.id = NEW.entreprise_id AND p.type = 'entreprise'
     ) THEN
    RAISE EXCEPTION 'La gratification entreprise doit référencer un partenaire de type entreprise.'
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gratifications_entreprise_type ON public.gratifications;
CREATE TRIGGER trg_gratifications_entreprise_type
BEFORE INSERT OR UPDATE ON public.gratifications
FOR EACH ROW EXECUTE FUNCTION public.check_gratification_entreprise_type();

REVOKE ALL ON FUNCTION public.check_gratification_entreprise_type() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. ÉVALUATION FACTUELLE DE LA FIDÉLITÉ D'UN ADHÉRENT
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_gratifications(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
    OR public.has_any_role(_user_id, ARRAY[
      'coordonnateur'::public.app_role,
      'directeur_general'::public.app_role
    ]);
$$;

REVOKE ALL ON FUNCTION public.can_manage_gratifications(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_gratifications(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.evaluer_fidelite_adherent(
  _adherent_id UUID,
  _date_debut DATE,
  _date_fin DATE
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cot AS (
    SELECT
      COUNT(DISTINCT c.periode) AS mois_cotises,
      COUNT(DISTINCT c.periode) FILTER (
        WHERE c.montant_paye >= c.montant_usd AND c.montant_usd > 0
      ) AS mois_payes_complets,
      COALESCE(SUM(c.montant_usd),0) AS montant_du,
      COALESCE(SUM(c.montant_paye),0) AS montant_paye
    FROM public.cotisations c
    WHERE (public.can_manage_gratifications(auth.uid()) OR public.owns_adherent(auth.uid(), _adherent_id))
      AND c.adherent_id = _adherent_id
      AND c.periode BETWEEN _date_debut AND _date_fin
  ),
  pec AS (
    SELECT COUNT(*)::bigint AS nombre_pec
    FROM public.prises_en_charge p
    WHERE (public.can_manage_gratifications(auth.uid()) OR public.owns_adherent(auth.uid(), _adherent_id))
      AND p.adherent_id = _adherent_id
      AND p.created_at::date BETWEEN _date_debut AND _date_fin
  ),
  remb AS (
    SELECT
      COUNT(*)::bigint AS nombre_remboursements,
      COALESCE(SUM(o.montant_usd),0) AS montant_rembourse
    FROM public.ordres_remboursement o
    WHERE (public.can_manage_gratifications(auth.uid()) OR public.owns_adherent(auth.uid(), _adherent_id))
      AND o.adherent_id = _adherent_id
      AND o.statut = 'paye'
      AND o.created_at::date BETWEEN _date_debut AND _date_fin
  )
  SELECT jsonb_build_object(
    'adherent_id', _adherent_id,
    'date_debut', _date_debut,
    'date_fin', _date_fin,
    'mois_cotises', cot.mois_cotises,
    'mois_payes_complets', cot.mois_payes_complets,
    'montant_du_usd', cot.montant_du,
    'montant_paye_usd', cot.montant_paye,
    'taux_paiement', CASE
      WHEN cot.montant_du > 0 THEN round((cot.montant_paye / cot.montant_du) * 100, 2)
      ELSE 0
    END,
    'nombre_prises_en_charge', pec.nombre_pec,
    'nombre_remboursements_payes', remb.nombre_remboursements,
    'montant_rembourse_usd', remb.montant_rembourse,
    'candidat_fidelite_annuelle', (
      (_date_fin - _date_debut + 1) >= 365
      AND cot.mois_payes_complets >= 12
      AND pec.nombre_pec = 0
    )
  )
  FROM cot, pec, remb;
$$;

REVOKE ALL ON FUNCTION public.evaluer_fidelite_adherent(uuid,date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evaluer_fidelite_adherent(uuid,date,date) TO authenticated;

COMMENT ON FUNCTION public.evaluer_fidelite_adherent(uuid,date,date) IS
  'Retourne uniquement des métriques calculées depuis les cotisations, prises en charge et remboursements. Le candidat de fidélité annuelle exige 12 mois complets et aucune prise en charge; aucun montant de gratification n''est inventé.';

-- ---------------------------------------------------------------------
-- 3. HYGIÈNE DES DONNÉES PUBLIQUES
-- ---------------------------------------------------------------------
-- Les coordonnées et partenaires de démonstration historiques restent
-- disponibles pour les tests internes mais ne sont jamais publiés tant
-- qu'ils ne sont pas explicitement validés par is_public=true.
UPDATE public.partenaires
SET is_public = false
WHERE slug IN (
  'cliniques-universitaires-kinshasa',
  'hgr-kinshasa',
  'centre-hospitalier-monkole',
  'clinique-ngaliema',
  'pharmacie-kin-sante',
  'pharmacie-bahumbu',
  'laboratoire-biokin',
  'laboratoire-centre-diagnostic',
  'centre-bien-etre-humanitas-plazza',
  'espace-zen-gombe',
  'congo-business-group',
  'kin-logistics-sarl'
);

-- Les réseaux sociaux historiques sont déjà désactivés par la migration
-- précédente. On vide aussi les coordonnées de contact de démonstration
-- afin qu'elles ne puissent pas être prises pour des coordonnées officielles.
UPDATE public.site_settings
SET value = '""'::jsonb
WHERE key IN ('site.email','site.phone','site.whatsapp','site.address');

COMMENT ON TABLE public.gratifications IS
  'Gratifications Humanitas pour adhérent ou entreprise. Un membre couvert par une entreprise reste un adhérent via adherents.entreprise_id; aucune table membre_couvert séparée.';

-- ---------------------------------------------------------------------
-- 4. ÉVALUATION FACTUELLE D'UNE ENTREPRISE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.evaluer_fidelite_entreprise(
  _entreprise_id UUID,
  _date_debut DATE,
  _date_fin DATE
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH membres AS (
    SELECT a.id
    FROM public.adherents a
    WHERE a.entreprise_id = _entreprise_id
  ),
  cot AS (
    SELECT
      COUNT(*) AS lignes_cotisations,
      COUNT(*) FILTER (WHERE c.montant_paye >= c.montant_usd AND c.montant_usd > 0) AS lignes_payees_completement,
      COALESCE(SUM(c.montant_usd),0) AS montant_du,
      COALESCE(SUM(c.montant_paye),0) AS montant_paye
    FROM public.cotisations c
    JOIN membres m ON m.id = c.adherent_id
    WHERE c.periode BETWEEN _date_debut AND _date_fin
  )
  SELECT jsonb_build_object(
    'entreprise_id', _entreprise_id,
    'date_debut', _date_debut,
    'date_fin', _date_fin,
    'nombre_membres_couverts', (SELECT COUNT(*) FROM membres),
    'lignes_cotisations', cot.lignes_cotisations,
    'lignes_payees_completement', cot.lignes_payees_completement,
    'taux_paiement', CASE
      WHEN cot.montant_du > 0 THEN round((cot.montant_paye / cot.montant_du) * 100, 2)
      ELSE 0
    END,
    'montant_du_usd', cot.montant_du,
    'montant_paye_usd', cot.montant_paye,
    'seuil_gratification_entreprise_parametre', false,
    'decision_automatique', false
  )
  FROM cot
  WHERE public.can_manage_gratifications(auth.uid())
     OR EXISTS (
       SELECT 1
       FROM public.partenaire_membres pm
       JOIN public.user_roles ur ON ur.user_id = pm.user_id AND ur.role = 'entreprise'
       WHERE pm.user_id = auth.uid()
         AND pm.partenaire_id = _entreprise_id
         AND pm.is_active = true
     );
$$;

REVOKE ALL ON FUNCTION public.evaluer_fidelite_entreprise(uuid,date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evaluer_fidelite_entreprise(uuid,date,date) TO authenticated;

COMMENT ON FUNCTION public.evaluer_fidelite_entreprise(uuid,date,date) IS
  'Calcule le nombre réel de membres couverts et les métriques de cotisation d''une entreprise. Aucun seuil de gratification n''est inventé : la décision automatique reste désactivée tant que Humanitas n''a pas validé les critères.';

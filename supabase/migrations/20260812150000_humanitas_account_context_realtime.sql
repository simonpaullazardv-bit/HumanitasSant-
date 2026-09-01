-- =====================================================================
-- HUMANITAS SANTÉ — identité métier, comptes par entité, bénéficiaires,
-- cartes individualisées, vérification établissement et temps réel.
--
-- Principe : le rôle applicatif est un code commun. L'identité métier
-- (adherent_id, beneficiaire_id ou partenaire_id) cloisonne ensuite le compte.
-- =====================================================================

-- 1. BÉNÉFICIAIRE = COMPTE INDIVIDUEL AVEC LE MÊME RÔLE "adherent" --------
ALTER TABLE public.beneficiaires
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS telephone text;

CREATE SEQUENCE IF NOT EXISTS public.beneficiaire_code_seq START 1;

CREATE OR REPLACE FUNCTION public.set_beneficiaire_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR btrim(NEW.code) = '' THEN
    NEW.code := 'BEN-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.beneficiaire_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beneficiaires_code ON public.beneficiaires;
CREATE TRIGGER trg_beneficiaires_code
BEFORE INSERT ON public.beneficiaires
FOR EACH ROW EXECUTE FUNCTION public.set_beneficiaire_code();

UPDATE public.beneficiaires
SET code = 'BEN-' || to_char(COALESCE(created_at, now()), 'YYYY') || '-' ||
  lpad(nextval('public.beneficiaire_code_seq')::text, 6, '0')
WHERE code IS NULL OR btrim(code) = '';

CREATE UNIQUE INDEX IF NOT EXISTS beneficiaires_code_uidx
  ON public.beneficiaires(code);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiaires_user_uidx
  ON public.beneficiaires(user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS beneficiaires_user_idx
  ON public.beneficiaires(user_id);

-- Le bénéficiaire voit uniquement son dossier et les informations strictement
-- nécessaires de son adhérent titulaire. L'adhérent titulaire garde son accès.
DROP POLICY IF EXISTS "beneficiaires_read" ON public.beneficiaires;
CREATE POLICY "beneficiaires_read"
ON public.beneficiaires
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.owns_adherent(auth.uid(), adherent_id)
  OR public.is_staff(auth.uid())
);

DROP POLICY IF EXISTS "beneficiaires_manage" ON public.beneficiaires;
CREATE POLICY "beneficiaires_manage"
ON public.beneficiaires
FOR ALL TO authenticated
USING (
  public.can_manage_adherents(auth.uid())
  OR public.owns_adherent(auth.uid(), adherent_id)
)
WITH CHECK (
  public.can_manage_adherents(auth.uid())
  OR public.owns_adherent(auth.uid(), adherent_id)
);

CREATE OR REPLACE FUNCTION public.owns_beneficiaire(
  _user_id uuid,
  _beneficiaire_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.beneficiaires b
    WHERE b.id = _beneficiaire_id
      AND b.user_id = _user_id
      AND b.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.owns_beneficiaire(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_beneficiaire(uuid, uuid) TO authenticated;

-- 2. CONTEXTE DE COMPTE CANONIQUE ----------------------------------------
-- On ne crée pas un nouveau rôle "beneficiaire" : un bénéficiaire utilise
-- le rôle applicatif "adherent" et son beneficiaire_id le distingue.
CREATE OR REPLACE FUNCTION public.mon_contexte_compte()
RETURNS TABLE (
  role public.app_role,
  contexte text,
  adherent_id uuid,
  beneficiaire_id uuid,
  partenaire_id uuid,
  identifiant text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role,
         CASE
           WHEN ur.role = 'adherent' AND b.user_id = auth.uid() THEN 'beneficiaire'
           WHEN ur.role = 'adherent' AND a.user_id = auth.uid() THEN 'adherent'
           WHEN ur.role = 'hopital' THEN 'hopital'
           WHEN ur.role = 'entreprise' THEN 'entreprise'
           ELSE 'staff'
         END AS contexte,
         a.id AS adherent_id,
         b.id AS beneficiaire_id,
         pm.partenaire_id,
         COALESCE(b.code, a.matricule, p.numero)
  FROM public.user_roles ur
  LEFT JOIN public.adherents a
    ON a.user_id = ur.user_id AND ur.role = 'adherent'
  LEFT JOIN public.beneficiaires b
    ON b.user_id = ur.user_id AND ur.role = 'adherent' AND b.is_active
  LEFT JOIN public.partenaire_membres pm
    ON pm.user_id = ur.user_id AND pm.is_active
  LEFT JOIN public.partenaires p
    ON p.id = pm.partenaire_id
  WHERE ur.user_id = auth.uid()
    AND (
      ur.role IN ('super_admin','administrateur','coordonnateur','medecin_conseil','financier','agent_humanitas')
      OR (ur.role = 'adherent' AND (a.id IS NOT NULL OR b.id IS NOT NULL))
      OR (ur.role IN ('hopital','entreprise') AND pm.id IS NOT NULL)
    );
$$;

REVOKE ALL ON FUNCTION public.mon_contexte_compte() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_contexte_compte() TO authenticated;

-- 3. CARTES : ADHÉRENT, BÉNÉFICIAIRE OU PERSONNEL -------------------------
ALTER TABLE public.cartes_membre
  ADD COLUMN IF NOT EXISTS beneficiaire_id uuid REFERENCES public.beneficiaires(id) ON DELETE CASCADE;

ALTER TABLE public.cartes_membre
  DROP CONSTRAINT IF EXISTS cartes_type_check;

ALTER TABLE public.cartes_membre
  ADD CONSTRAINT cartes_type_check CHECK (
    (type_carte = 'adherent' AND adherent_id IS NOT NULL AND beneficiaire_id IS NULL AND personnel_id IS NULL)
    OR (type_carte = 'beneficiaire' AND adherent_id IS NULL AND beneficiaire_id IS NOT NULL AND personnel_id IS NULL)
    OR (type_carte = 'personnel' AND adherent_id IS NULL AND beneficiaire_id IS NULL AND personnel_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS cartes_active_beneficiaire_uidx
  ON public.cartes_membre (beneficiaire_id)
  WHERE statut = 'active' AND beneficiaire_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cartes_beneficiaire_idx
  ON public.cartes_membre(beneficiaire_id);

DROP POLICY IF EXISTS "cartes_read" ON public.cartes_membre;
CREATE POLICY "cartes_read"
ON public.cartes_membre
FOR SELECT TO authenticated
USING (
  public.owns_adherent(auth.uid(), adherent_id)
  OR public.owns_beneficiaire(auth.uid(), beneficiaire_id)
  OR personnel_id IN (SELECT p.id FROM public.personnel p WHERE p.user_id = auth.uid())
  OR public.is_staff(auth.uid())
);

-- La policy principale ci-dessus couvre déjà le bénéficiaire.

-- 5. VÉRIFICATION HÔPITAL / PARTENAIRE PAR CODE ADHÉRENT OU BÉNÉFICIAIRE --
CREATE OR REPLACE FUNCTION public.partenaire_verifier_code(
  _partenaire_id uuid,
  _code text DEFAULT NULL,
  _token uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contrat record;
  v_adherent record;
  v_beneficiaire record;
  v_carte record;
  v_categorie record;
  v_mensualites integer := 0;
  v_plafond jsonb;
BEGIN
  IF NOT public.appartient_partenaire(auth.uid(), _partenaire_id)
     AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Accès partenaire non autorisé';
  END IF;

  SELECT c.* INTO v_contrat
  FROM public.contrats_partenaires c
  WHERE c.partenaire_id = _partenaire_id
    AND c.statut = 'actif'
    AND c.date_debut <= current_date
    AND (c.date_fin IS NULL OR c.date_fin >= current_date)
  ORDER BY c.date_debut DESC
  LIMIT 1;

  IF v_contrat.id IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'motifs', jsonb_build_array('Aucun contrat partenaire valide')
    );
  END IF;

  IF _token IS NOT NULL THEN
    SELECT a.* INTO v_adherent
    FROM public.cartes_membre cm
    JOIN public.adherents a ON a.id = cm.adherent_id
    WHERE cm.qr_token = _token AND cm.statut = 'active'
    LIMIT 1;

    IF v_adherent.id IS NULL THEN
      SELECT b.* INTO v_beneficiaire
      FROM public.cartes_membre cm
      JOIN public.beneficiaires b ON b.id = cm.beneficiaire_id
      WHERE cm.qr_token = _token AND cm.statut = 'active' AND b.is_active = true
      LIMIT 1;
    END IF;
  ELSE
    SELECT a.* INTO v_adherent
    FROM public.adherents a
    WHERE upper(btrim(a.matricule)) = upper(btrim(_code))
       OR upper(btrim(coalesce(a.email, ''))) = upper(btrim(_code))
    LIMIT 1;
  END IF;

  IF v_adherent.id IS NOT NULL THEN
    SELECT cm.* INTO v_carte
    FROM public.cartes_membre cm
    WHERE cm.adherent_id = v_adherent.id
      AND cm.statut = 'active'
    ORDER BY cm.date_emission DESC
    LIMIT 1;

    SELECT cat.* INTO v_categorie
    FROM public.categories_adhesion cat
    WHERE cat.id = v_adherent.categorie_id;
    SELECT count(*)::integer INTO v_mensualites
    FROM public.cotisations c
    WHERE c.adherent_id = v_adherent.id AND c.statut = 'payee';
    v_plafond := public.plafond_disponible(v_adherent.id);

    RETURN jsonb_build_object(
      'eligible', v_adherent.statut = 'actif' AND v_carte.id IS NOT NULL AND v_carte.statut = 'active' AND (v_carte.date_expiration IS NULL OR v_carte.date_expiration >= current_date),
      'type_personne', 'adherent',
      'adherent_id', v_adherent.id,
      'beneficiaire_id', NULL,
      'matricule', v_adherent.matricule,
      'code', v_adherent.matricule,
      'titulaire', concat_ws(' ', v_adherent.nom, v_adherent.postnom, v_adherent.prenom),
      'statut', v_adherent.statut,
      'categorie', CASE WHEN v_categorie.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_categorie.id, 'nom', v_categorie.nom, 'taux_couverture', v_categorie.taux_couverture, 'prestations_autorisees', v_categorie.prestations_autorisees) END,
      'cotisations', jsonb_build_object('mensualites_validees', v_mensualites, 'droits_ouverts', public.droits_ouverts(v_adherent.id)),
      'plafond', v_plafond,
      'carte', CASE WHEN v_carte.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_carte.id, 'numero', v_carte.numero, 'statut', v_carte.statut, 'date_expiration', v_carte.date_expiration) END,
      'contrat', jsonb_build_object('numero', v_contrat.numero, 'date_fin', v_contrat.date_fin, 'taux_couverture', v_contrat.taux_couverture),
      'message', CASE WHEN v_adherent.statut = 'actif' AND v_carte.id IS NOT NULL AND (v_carte.date_expiration IS NULL OR v_carte.date_expiration >= current_date) THEN 'Droits ouverts' ELSE 'Droits à vérifier' END
    );
  END IF;

  IF v_beneficiaire.id IS NULL THEN
    SELECT b.*, a.matricule AS adherent_matricule, a.statut AS adherent_statut
    INTO v_beneficiaire
    FROM public.beneficiaires b
    JOIN public.adherents a ON a.id = b.adherent_id
    WHERE b.is_active = true
      AND upper(btrim(coalesce(b.code, ''))) = upper(btrim(_code))
    LIMIT 1;
  ELSE
    SELECT b.*, a.matricule AS adherent_matricule, a.statut AS adherent_statut
    INTO v_beneficiaire
    FROM public.beneficiaires b
    JOIN public.adherents a ON a.id = b.adherent_id
    WHERE b.id = v_beneficiaire.id
    LIMIT 1;
  END IF;

  IF v_beneficiaire.id IS NOT NULL THEN
    SELECT cm.* INTO v_carte
    FROM public.cartes_membre cm
    WHERE cm.beneficiaire_id = v_beneficiaire.id
      AND cm.statut = 'active'
    ORDER BY cm.date_emission DESC
    LIMIT 1;

    SELECT cat.* INTO v_categorie
    FROM public.categories_adhesion cat
    JOIN public.adherents a ON a.categorie_id = cat.id
    WHERE a.id = v_beneficiaire.adherent_id;
    SELECT count(*)::integer INTO v_mensualites
    FROM public.cotisations c
    WHERE c.adherent_id = v_beneficiaire.adherent_id AND c.statut = 'payee';
    v_plafond := public.plafond_disponible(v_beneficiaire.adherent_id);

    RETURN jsonb_build_object(
      'eligible', v_beneficiaire.is_active AND v_beneficiaire.adherent_statut = 'actif' AND v_carte.id IS NOT NULL AND v_carte.statut = 'active' AND (v_carte.date_expiration IS NULL OR v_carte.date_expiration >= current_date),
      'type_personne', 'beneficiaire',
      'adherent_id', v_beneficiaire.adherent_id,
      'beneficiaire_id', v_beneficiaire.id,
      'matricule', v_beneficiaire.adherent_matricule,
      'code', v_beneficiaire.code,
      'titulaire', concat_ws(' ', v_beneficiaire.nom, v_beneficiaire.prenom),
      'lien', v_beneficiaire.lien,
      'statut', CASE WHEN v_beneficiaire.is_active AND v_beneficiaire.adherent_statut = 'actif' THEN 'actif' ELSE 'inactif' END,
      'statut_adherent', v_beneficiaire.adherent_statut,
      'categorie', CASE WHEN v_categorie.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_categorie.id, 'nom', v_categorie.nom, 'taux_couverture', v_categorie.taux_couverture, 'prestations_autorisees', v_categorie.prestations_autorisees) END,
      'cotisations', jsonb_build_object('mensualites_validees', v_mensualites, 'droits_ouverts', public.droits_ouverts(v_beneficiaire.adherent_id)),
      'plafond', v_plafond,
      'carte', CASE WHEN v_carte.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_carte.id, 'numero', v_carte.numero, 'statut', v_carte.statut, 'date_expiration', v_carte.date_expiration) END,
      'contrat', jsonb_build_object('numero', v_contrat.numero, 'date_fin', v_contrat.date_fin, 'taux_couverture', v_contrat.taux_couverture),
      'message', CASE WHEN v_beneficiaire.is_active AND v_beneficiaire.adherent_statut = 'actif' AND v_carte.id IS NOT NULL AND (v_carte.date_expiration IS NULL OR v_carte.date_expiration >= current_date) THEN 'Droits ouverts' ELSE 'Droits à vérifier' END
    );
  END IF;

  RETURN jsonb_build_object(
    'eligible', false,
    'motifs', jsonb_build_array('Code Humanitas introuvable')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.partenaire_verifier_code(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partenaire_verifier_code(uuid, text, uuid) TO authenticated;

-- 6. TEMPS RÉEL ----------------------------------------------------------
-- Ces tables deviennent disponibles dans Supabase Realtime. Si une table est
-- déjà publiée, l'exception est ignorée.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','adherents','beneficiaires','adhesions','cotisations','paiements',
    'cartes_membre','prises_en_charge','pec_decisions','pec_prestations',
    'partenaires','partenaire_membres','factures_partenaires','ordres_remboursement',
    'notifications_internes','user_notification_preferences'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END;
$$;

-- 7. VUE DE SUIVI SÉCURISÉE POUR LE COMPTE COURANT -----------------------
CREATE OR REPLACE VIEW public.mon_compte AS
SELECT * FROM public.mon_contexte_compte();

GRANT SELECT ON public.mon_compte TO authenticated;

COMMENT ON FUNCTION public.mon_contexte_compte() IS
'Résout le contexte métier du compte connecté : rôle commun + identifiant privé adhérent, bénéficiaire ou partenaire.';

COMMENT ON FUNCTION public.partenaire_verifier_code(uuid, text, uuid) IS
'Verification sécurisée d''un code Humanitas par un partenaire/hôpital. Ne renvoie que les informations nécessaires à la prise en charge.';

-- 8. CLOISONNEMENT DES PRISES EN CHARGE POUR LE COMPTE BÉNÉFICIAIRE --------
DROP POLICY IF EXISTS "Adherent lit ses prises en charge" ON public.prises_en_charge;
CREATE POLICY "Adherent ou beneficiaire lit ses prises en charge"
ON public.prises_en_charge
FOR SELECT TO authenticated
USING (
  public.owns_adherent(auth.uid(), adherent_id)
  OR public.owns_beneficiaire(auth.uid(), beneficiaire_id)
);

DROP POLICY IF EXISTS "Adherent lit ses prestations" ON public.pec_prestations;
CREATE POLICY "Adherent ou beneficiaire lit ses prestations"
ON public.pec_prestations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.prises_en_charge p
    WHERE p.id = prise_en_charge_id
      AND (
        public.owns_adherent(auth.uid(), p.adherent_id)
        OR public.owns_beneficiaire(auth.uid(), p.beneficiaire_id)
      )
  )
);

DROP POLICY IF EXISTS "Partenaire lit ses ordres" ON public.ordres_remboursement;
CREATE POLICY "Partenaire lit ses ordres"
ON public.ordres_remboursement
FOR SELECT TO authenticated
USING (
  public.appartient_partenaire(auth.uid(), partenaire_id)
  OR public.is_staff(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.prises_en_charge p
    WHERE p.id = prise_en_charge_id
      AND (
        public.owns_adherent(auth.uid(), p.adherent_id)
        OR public.owns_beneficiaire(auth.uid(), p.beneficiaire_id)
      )
  )
);

-- 9. TRIGGER DE MISE À JOUR POUR LES PRÉFÉRENCES ---------------------------
DROP TRIGGER IF EXISTS trg_user_notification_preferences_updated ON public.user_notification_preferences;
CREATE TRIGGER trg_user_notification_preferences_updated
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_preferences_self" ON public.user_notification_preferences;
CREATE POLICY "notification_preferences_self"
ON public.user_notification_preferences
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "notification_preferences_self_write"
ON public.user_notification_preferences
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "notification_preferences_self_update"
ON public.user_notification_preferences;

CREATE POLICY "notification_preferences_self_update"
ON public.user_notification_preferences
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 10. POLITIQUE PARTENAIRE : l'utilisateur ne peut pas choisir arbitrairement
-- un partenaire différent de celui auquel son compte est rattaché.
DROP POLICY IF EXISTS "Partenaire voit ses documents" ON public.partenaire_documents;
CREATE POLICY "Partenaire voit ses documents"
ON public.partenaire_documents
FOR SELECT TO authenticated
USING (public.appartient_partenaire(auth.uid(), partenaire_id) OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Partenaire lit ses contrats" ON public.contrats_partenaires;
CREATE POLICY "Partenaire lit ses contrats"
ON public.contrats_partenaires
FOR SELECT TO authenticated
USING (public.appartient_partenaire(auth.uid(), partenaire_id) OR public.is_staff(auth.uid()));

-- 11. Protection du rattachement compte ↔ bénéficiaire -------------------
CREATE OR REPLACE FUNCTION public.protect_beneficiaire_user_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid())
     AND (TG_OP = 'INSERT' OR NEW.user_id IS DISTINCT FROM OLD.user_id)
     AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Un utilisateur ne peut rattacher qu''un compte qui lui appartient.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beneficiaire_user_link ON public.beneficiaires;
CREATE TRIGGER trg_beneficiaire_user_link
BEFORE INSERT OR UPDATE ON public.beneficiaires
FOR EACH ROW EXECUTE FUNCTION public.protect_beneficiaire_user_link();

-- 12. RATTACHEMENT SÉCURISÉ D'UN COMPTE BÉNÉFICIAIRE ----------------------
-- Le code seul ne suffit pas : l'adresse email du dossier doit correspondre
-- à l'email authentifié. Un administrateur peut toujours effectuer le
-- rattachement manuellement via la table bénéficiaires.
CREATE OR REPLACE FUNCTION public.lier_mon_compte_beneficiaire(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_b record; v_email text;
BEGIN
  v_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  SELECT * INTO v_b
  FROM public.beneficiaires
  WHERE upper(btrim(code)) = upper(btrim(_code))
    AND user_id IS NULL
    AND is_active = true
    AND email IS NOT NULL
    AND lower(trim(email)) = v_email
  FOR UPDATE;

  IF v_b.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Code bénéficiaire introuvable ou email non concordant.');
  END IF;

  UPDATE public.beneficiaires
  SET user_id = auth.uid(), updated_at = now()
  WHERE id = v_b.id;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (auth.uid(), 'adherent')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'beneficiaire_id', v_b.id, 'code', v_b.code);
END;
$$;

REVOKE ALL ON FUNCTION public.lier_mon_compte_beneficiaire(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lier_mon_compte_beneficiaire(text) TO authenticated;

-- 13. GARANTIE SERVEUR DU SUJET DE PRISE EN CHARGE -----------------------
CREATE OR REPLACE FUNCTION public.check_pec_subject()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_parent uuid; v_statut public.statut_adherent; v_card uuid;
BEGIN
  IF NEW.adherent_id IS NULL AND NEW.beneficiaire_id IS NULL THEN
    RAISE EXCEPTION 'Une prise en charge doit être rattachée à un adhérent ou un bénéficiaire.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.beneficiaire_id IS NOT NULL THEN
    SELECT b.adherent_id, a.statut
    INTO v_parent, v_statut
    FROM public.beneficiaires b
    JOIN public.adherents a ON a.id = b.adherent_id
    WHERE b.id = NEW.beneficiaire_id AND b.is_active = true;

    IF v_parent IS NULL THEN
      RAISE EXCEPTION 'Bénéficiaire introuvable ou inactif.' USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.adherent_id IS NULL THEN
      NEW.adherent_id := v_parent;
    ELSIF NEW.adherent_id <> v_parent THEN
      RAISE EXCEPTION 'Le bénéficiaire ne correspond pas à l''adhérent fourni.' USING ERRCODE = 'check_violation';
    END IF;

    IF v_statut <> 'actif' THEN
      RAISE EXCEPTION 'La couverture de l''adhérent titulaire n''est pas active.' USING ERRCODE = 'check_violation';
    END IF;

    SELECT cm.id INTO v_card
    FROM public.cartes_membre cm
    WHERE cm.beneficiaire_id = NEW.beneficiaire_id
      AND cm.statut = 'active'
      AND (cm.date_expiration IS NULL OR cm.date_expiration >= current_date)
    LIMIT 1;
    IF v_card IS NULL THEN
      RAISE EXCEPTION 'Le bénéficiaire ne possède pas de carte active valide.' USING ERRCODE = 'check_violation';
    END IF;
    NEW.carte_id := COALESCE(NEW.carte_id, v_card);
  ELSE
    SELECT a.statut INTO v_statut FROM public.adherents a WHERE a.id = NEW.adherent_id;
    IF v_statut <> 'actif' THEN
      RAISE EXCEPTION 'La couverture de l''adhérent n''est pas active.' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.carte_id IS NULL THEN
      SELECT cm.id INTO v_card
      FROM public.cartes_membre cm
      WHERE cm.adherent_id = NEW.adherent_id
        AND cm.statut = 'active'
        AND (cm.date_expiration IS NULL OR cm.date_expiration >= current_date)
      ORDER BY cm.date_emission DESC
      LIMIT 1;
      NEW.carte_id := v_card;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pec_subject ON public.prises_en_charge;
CREATE TRIGGER trg_pec_subject
BEFORE INSERT OR UPDATE ON public.prises_en_charge
FOR EACH ROW EXECUTE FUNCTION public.check_pec_subject();

-- 14. ÉMISSION / RÉIMPRESSION D'UNE CARTE BÉNÉFICIAIRE -------------------
CREATE OR REPLACE FUNCTION public.emettre_carte_beneficiaire(
  _beneficiaire_id uuid,
  _motif text DEFAULT NULL,
  _paiement_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_b record;
  v_old record;
  v_new uuid;
BEGIN
  IF NOT public.can_manage_adherents(auth.uid()) THEN
    RAISE EXCEPTION 'Accès refusé.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT b.*, a.statut AS adherent_statut, a.categorie_id
  INTO v_b
  FROM public.beneficiaires b
  JOIN public.adherents a ON a.id = b.adherent_id
  WHERE b.id = _beneficiaire_id AND b.is_active = true;

  IF v_b.id IS NULL THEN
    RAISE EXCEPTION 'Bénéficiaire introuvable ou inactif.' USING ERRCODE = 'check_violation';
  END IF;
  IF v_b.adherent_statut <> 'actif' THEN
    RAISE EXCEPTION 'La couverture de l''adhérent titulaire n''est pas active.' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_old
  FROM public.cartes_membre
  WHERE beneficiaire_id = _beneficiaire_id AND statut = 'active'
  LIMIT 1;

  IF FOUND THEN
    IF _motif IS NULL OR btrim(_motif) = '' THEN
      RAISE EXCEPTION 'Une carte bénéficiaire active existe déjà : indiquez un motif de réimpression.'
        USING ERRCODE = 'check_violation';
    END IF;
    UPDATE public.cartes_membre
    SET statut = 'remplacee', is_active = false
    WHERE id = v_old.id;
  END IF;

  INSERT INTO public.cartes_membre
    (beneficiaire_id, type_carte, categorie_id, motif, carte_precedente_id, paiement_id, created_by)
  VALUES
    (_beneficiaire_id, 'beneficiaire', v_b.categorie_id, _motif, v_old.id, _paiement_id, auth.uid())
  RETURNING id INTO v_new;

  IF v_old.id IS NOT NULL THEN
    INSERT INTO public.cartes_reimpressions
      (ancienne_carte_id, nouvelle_carte_id, motif, frais_usd, paiement_id, demande_par)
    VALUES (
      v_old.id,
      v_new,
      _motif,
      public.param_numeric('carte.prix_reimpression_usd', 5),
      _paiement_id,
      auth.uid()
    );
  END IF;

  INSERT INTO public.adherent_historique (adherent_id, evenement, details, created_by)
  VALUES (
    v_b.adherent_id,
    CASE WHEN v_old.id IS NULL THEN 'carte_beneficiaire_emise' ELSE 'carte_beneficiaire_reimprimee' END,
    jsonb_build_object('beneficiaire_id', _beneficiaire_id, 'carte_id', v_new, 'ancienne_carte_id', v_old.id, 'motif', _motif),
    auth.uid()
  );

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.emettre_carte_beneficiaire(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.emettre_carte_beneficiaire(uuid, text, uuid) TO authenticated;

-- 15. VÉRIFICATION PUBLIQUE D'UNE CARTE BÉNÉFICIAIRE ----------------------
CREATE OR REPLACE FUNCTION public.verifier_carte(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
  v_res jsonb;
  v_droits boolean := false;
  v_cat text;
  v_nom text;
  v_statut text;
BEGIN
  SELECT * INTO c FROM public.cartes_membre WHERE qr_token = _token;
  IF NOT FOUND THEN
    INSERT INTO public.cartes_scans (token, resultat) VALUES (_token, 'inconnue');
    RETURN jsonb_build_object('valide', false, 'motif', 'Carte inconnue');
  END IF;

  IF c.type_carte = 'personnel' THEN
    SELECT initcap(left(p.prenom, 1) || '. ' || p.nom), p.fonction, p.statut
    INTO v_nom, v_cat, v_statut
    FROM public.personnel p WHERE p.id = c.personnel_id;
    v_droits := v_statut = 'actif';
  ELSIF c.type_carte = 'beneficiaire' THEN
    SELECT initcap(left(coalesce(b.prenom, b.nom), 1) || '. ' || b.nom), cat.nom,
           CASE WHEN b.is_active AND a.statut = 'actif' THEN 'actif' ELSE 'inactif' END
    INTO v_nom, v_cat, v_statut
    FROM public.beneficiaires b
    JOIN public.adherents a ON a.id = b.adherent_id
    LEFT JOIN public.categories_adhesion cat ON cat.id = a.categorie_id
    WHERE b.id = c.beneficiaire_id;
    v_droits := v_statut = 'actif';
  ELSE
    SELECT initcap(left(coalesce(a.prenom, a.nom), 1) || '. ' || a.nom), cat.nom, a.statut::text
    INTO v_nom, v_cat, v_statut
    FROM public.adherents a
    LEFT JOIN public.categories_adhesion cat ON cat.id = coalesce(c.categorie_id, a.categorie_id)
    WHERE a.id = c.adherent_id;
    v_droits := public.droits_ouverts(c.adherent_id);
  END IF;

  v_res := jsonb_build_object(
    'valide', c.statut = 'active'
      AND (c.date_expiration IS NULL OR c.date_expiration >= current_date)
      AND coalesce(v_droits, false),
    'type', c.type_carte,
    'numero', c.numero,
    'titulaire', v_nom,
    'categorie', v_cat,
    'statut_carte', c.statut,
    'statut_titulaire', v_statut,
    'date_emission', c.date_emission,
    'date_expiration', c.date_expiration,
    'droits_ouverts', coalesce(v_droits, false),
    'verifie_le', now()
  );

  INSERT INTO public.cartes_scans (carte_id, token, resultat)
  VALUES (c.id, _token, CASE WHEN (v_res ->> 'valide')::boolean THEN 'valide' ELSE 'invalide' END);

  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verifier_carte(uuid) TO anon, authenticated;

-- 16. ESPACE ENTREPRISE : collaborateurs de son propre contrat -------------
DROP POLICY IF EXISTS "adherents_read" ON public.adherents;
CREATE POLICY "adherents_read"
ON public.adherents
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_staff(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.partenaire_membres pm
    JOIN public.user_roles ur ON ur.user_id = pm.user_id AND ur.role = 'entreprise'
    WHERE pm.user_id = auth.uid()
      AND pm.partenaire_id = adherents.entreprise_id
      AND pm.is_active = true
  )
);

DROP POLICY IF EXISTS "beneficiaires_read" ON public.beneficiaires;
CREATE POLICY "beneficiaires_read"
ON public.beneficiaires
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.owns_adherent(auth.uid(), adherent_id)
  OR public.is_staff(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.adherents a
    JOIN public.partenaire_membres pm ON pm.partenaire_id = a.entreprise_id
    JOIN public.user_roles ur ON ur.user_id = pm.user_id AND ur.role = 'entreprise'
    WHERE a.id = beneficiaires.adherent_id
      AND pm.user_id = auth.uid()
      AND pm.is_active = true
  )
);

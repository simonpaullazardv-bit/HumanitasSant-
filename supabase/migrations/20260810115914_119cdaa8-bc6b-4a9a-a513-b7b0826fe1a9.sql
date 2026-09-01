-- =========================================================
-- MODULE CARTES
-- =========================================================

-- 1. PERSONNEL ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  matricule text NOT NULL UNIQUE,
  nom text NOT NULL,
  postnom text,
  prenom text,
  sexe text,
  fonction text,
  departement text,
  grade text,
  email text,
  telephone text,
  photo_url text,
  date_embauche date,
  statut text NOT NULL DEFAULT 'actif',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personnel TO authenticated;
GRANT ALL ON public.personnel TO service_role;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personnel_read" ON public.personnel FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "personnel_manage" ON public.personnel FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_personnel_updated BEFORE UPDATE ON public.personnel
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE SEQUENCE IF NOT EXISTS public.personnel_matricule_seq START 1;

CREATE OR REPLACE FUNCTION public.set_personnel_matricule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.matricule IS NULL OR btrim(NEW.matricule) = '' THEN
    NEW.matricule := 'HS-AG-' || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('public.personnel_matricule_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_personnel_matricule BEFORE INSERT ON public.personnel
  FOR EACH ROW EXECUTE FUNCTION public.set_personnel_matricule();

-- 2. CARTES ---------------------------------------------------
ALTER TABLE public.cartes_membre
  ADD COLUMN IF NOT EXISTS type_carte text NOT NULL DEFAULT 'adherent',
  ADD COLUMN IF NOT EXISTS personnel_id uuid REFERENCES public.personnel(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS motif text,
  ADD COLUMN IF NOT EXISTS carte_precedente_id uuid REFERENCES public.cartes_membre(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paiement_id uuid REFERENCES public.paiements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS categorie_id uuid REFERENCES public.categories_adhesion(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS derniere_impression timestamptz,
  ADD COLUMN IF NOT EXISTS nb_impressions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE public.cartes_membre ALTER COLUMN adherent_id DROP NOT NULL;
ALTER TABLE public.cartes_membre DROP CONSTRAINT IF EXISTS cartes_membre_adherent_id_key;

ALTER TABLE public.cartes_membre DROP CONSTRAINT IF EXISTS cartes_type_check;
ALTER TABLE public.cartes_membre ADD CONSTRAINT cartes_type_check CHECK (
  (type_carte = 'adherent' AND adherent_id IS NOT NULL AND personnel_id IS NULL)
  OR (type_carte = 'personnel' AND personnel_id IS NOT NULL AND adherent_id IS NULL)
);
ALTER TABLE public.cartes_membre DROP CONSTRAINT IF EXISTS cartes_statut_check;
ALTER TABLE public.cartes_membre ADD CONSTRAINT cartes_statut_check
  CHECK (statut IN ('active','remplacee','perdue','annulee','expiree'));

CREATE UNIQUE INDEX IF NOT EXISTS cartes_active_adherent_uidx
  ON public.cartes_membre (adherent_id) WHERE statut = 'active' AND adherent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cartes_active_personnel_uidx
  ON public.cartes_membre (personnel_id) WHERE statut = 'active' AND personnel_id IS NOT NULL;

-- numero auto
CREATE SEQUENCE IF NOT EXISTS public.carte_numero_seq START 1;

CREATE OR REPLACE FUNCTION public.set_carte_numero()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := CASE WHEN NEW.type_carte = 'personnel' THEN 'CP-' ELSE 'CA-' END
      || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('public.carte_numero_seq')::text, 6, '0');
  END IF;
  IF NEW.date_expiration IS NULL THEN
    NEW.date_expiration := (COALESCE(NEW.date_emission, current_date)
      + (public.param_numeric('carte.validite_mois', 12)::int || ' months')::interval)::date;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_cartes_numero ON public.cartes_membre;
CREATE TRIGGER trg_cartes_numero BEFORE INSERT ON public.cartes_membre
  FOR EACH ROW EXECUTE FUNCTION public.set_carte_numero();

-- 3. CONDITIONS D'IMPRESSION ----------------------------------
CREATE OR REPLACE FUNCTION public.carte_conditions(_adherent_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; v_adhesion boolean; v_frais boolean; v_infos boolean; v_manquants text[] := '{}';
BEGIN
  SELECT * INTO a FROM public.adherents WHERE id = _adherent_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('imprimable', false, 'erreur', 'Adherent introuvable'); END IF;

  v_adhesion := a.statut IN ('actif') AND EXISTS (
    SELECT 1 FROM public.adhesions WHERE adherent_id = _adherent_id AND statut = 'actif'
  );

  v_frais := EXISTS (
    SELECT 1 FROM public.paiements
    WHERE adherent_id = _adherent_id AND statut = 'valide' AND type_operation = 'frais_carte'
  );

  IF a.nom IS NULL OR btrim(a.nom) = '' THEN v_manquants := v_manquants || 'nom'; END IF;
  IF a.prenom IS NULL OR btrim(a.prenom) = '' THEN v_manquants := v_manquants || 'prenom'; END IF;
  IF a.date_naissance IS NULL THEN v_manquants := v_manquants || 'date_naissance'; END IF;
  IF a.telephone IS NULL OR btrim(a.telephone) = '' THEN v_manquants := v_manquants || 'telephone'; END IF;
  IF a.photo_url IS NULL OR btrim(a.photo_url) = '' THEN v_manquants := v_manquants || 'photo'; END IF;
  IF a.categorie_id IS NULL THEN v_manquants := v_manquants || 'categorie'; END IF;
  v_infos := array_length(v_manquants, 1) IS NULL;

  RETURN jsonb_build_object(
    'adhesion_validee', v_adhesion,
    'frais_carte_payes', v_frais,
    'infos_completes', v_infos,
    'champs_manquants', to_jsonb(v_manquants),
    'imprimable', v_adhesion AND v_frais AND v_infos
  );
END; $$;

-- 4. HISTORIQUE D'IMPRESSION ----------------------------------
CREATE TABLE IF NOT EXISTS public.cartes_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carte_id uuid NOT NULL REFERENCES public.cartes_membre(id) ON DELETE CASCADE,
  format text NOT NULL DEFAULT 'pdf',
  mode text NOT NULL DEFAULT 'individuelle',
  motif text,
  lot_id uuid,
  imprime_par uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.cartes_impressions TO authenticated;
GRANT ALL ON public.cartes_impressions TO service_role;
ALTER TABLE public.cartes_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impressions_read" ON public.cartes_impressions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "impressions_insert" ON public.cartes_impressions FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_adherents(auth.uid()));

CREATE OR REPLACE FUNCTION public.check_impression()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; cond jsonb;
BEGIN
  SELECT * INTO c FROM public.cartes_membre WHERE id = NEW.carte_id;
  IF c.statut <> 'active' THEN
    RAISE EXCEPTION 'Impression refusee : la carte n''est pas active.' USING ERRCODE = 'check_violation';
  END IF;
  IF c.type_carte = 'adherent' THEN
    cond := public.carte_conditions(c.adherent_id);
    IF NOT (cond ->> 'imprimable')::boolean THEN
      RAISE EXCEPTION 'Impression refusee : conditions non remplies (%).', cond::text
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  NEW.imprime_par := COALESCE(NEW.imprime_par, auth.uid());
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_impression_check ON public.cartes_impressions;
CREATE TRIGGER trg_impression_check BEFORE INSERT ON public.cartes_impressions
  FOR EACH ROW EXECUTE FUNCTION public.check_impression();

CREATE OR REPLACE FUNCTION public.after_impression()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cartes_membre
    SET nb_impressions = nb_impressions + 1, derniere_impression = now()
    WHERE id = NEW.carte_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_impression_after ON public.cartes_impressions;
CREATE TRIGGER trg_impression_after AFTER INSERT ON public.cartes_impressions
  FOR EACH ROW EXECUTE FUNCTION public.after_impression();

-- 5. REIMPRESSIONS --------------------------------------------
CREATE TABLE IF NOT EXISTS public.cartes_reimpressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ancienne_carte_id uuid NOT NULL REFERENCES public.cartes_membre(id) ON DELETE CASCADE,
  nouvelle_carte_id uuid NOT NULL REFERENCES public.cartes_membre(id) ON DELETE CASCADE,
  motif text NOT NULL,
  frais_usd numeric(12,2) NOT NULL DEFAULT 0,
  paiement_id uuid REFERENCES public.paiements(id) ON DELETE SET NULL,
  demande_par uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.cartes_reimpressions TO authenticated;
GRANT ALL ON public.cartes_reimpressions TO service_role;
ALTER TABLE public.cartes_reimpressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reimpressions_read" ON public.cartes_reimpressions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "reimpressions_insert" ON public.cartes_reimpressions FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_adherents(auth.uid()));

-- Emission / reimpression atomique
CREATE OR REPLACE FUNCTION public.emettre_carte(
  _adherent_id uuid DEFAULT NULL,
  _personnel_id uuid DEFAULT NULL,
  _motif text DEFAULT NULL,
  _paiement_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old record; v_new uuid; v_type text; v_cat uuid; cond jsonb; v_frais numeric;
BEGIN
  IF NOT public.can_manage_adherents(auth.uid()) THEN
    RAISE EXCEPTION 'Acces refuse.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF (_adherent_id IS NULL) = (_personnel_id IS NULL) THEN
    RAISE EXCEPTION 'Indiquez un adherent OU un agent.' USING ERRCODE = 'check_violation';
  END IF;
  v_type := CASE WHEN _personnel_id IS NULL THEN 'adherent' ELSE 'personnel' END;

  IF v_type = 'adherent' THEN
    cond := public.carte_conditions(_adherent_id);
    IF NOT (cond ->> 'imprimable')::boolean THEN
      RAISE EXCEPTION 'Emission refusee : conditions non remplies (%).', cond::text
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT categorie_id INTO v_cat FROM public.adherents WHERE id = _adherent_id;
  END IF;

  SELECT * INTO v_old FROM public.cartes_membre
   WHERE statut = 'active'
     AND ((_adherent_id IS NOT NULL AND adherent_id = _adherent_id)
       OR (_personnel_id IS NOT NULL AND personnel_id = _personnel_id));

  IF FOUND THEN
    IF _motif IS NULL OR btrim(_motif) = '' THEN
      RAISE EXCEPTION 'Une carte active existe deja : indiquez un motif de reimpression.'
        USING ERRCODE = 'check_violation';
    END IF;
    UPDATE public.cartes_membre SET statut = 'remplacee', is_active = false WHERE id = v_old.id;
  END IF;

  INSERT INTO public.cartes_membre
    (adherent_id, personnel_id, type_carte, categorie_id, motif, carte_precedente_id, paiement_id, created_by)
  VALUES (_adherent_id, _personnel_id, v_type, v_cat, _motif, v_old.id, _paiement_id, auth.uid())
  RETURNING id INTO v_new;

  IF v_old.id IS NOT NULL THEN
    v_frais := public.param_numeric('carte.prix_reimpression_usd', 5);
    INSERT INTO public.cartes_reimpressions
      (ancienne_carte_id, nouvelle_carte_id, motif, frais_usd, paiement_id, demande_par)
    VALUES (v_old.id, v_new, _motif, v_frais, _paiement_id, auth.uid());
  END IF;

  IF _adherent_id IS NOT NULL THEN
    INSERT INTO public.adherent_historique (adherent_id, evenement, details, created_by)
    VALUES (_adherent_id, CASE WHEN v_old.id IS NULL THEN 'carte_emise' ELSE 'carte_reimprimee' END,
            jsonb_build_object('carte_id', v_new, 'ancienne_carte_id', v_old.id, 'motif', _motif),
            auth.uid());
  END IF;

  RETURN v_new;
END; $$;

GRANT EXECUTE ON FUNCTION public.emettre_carte(uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carte_conditions(uuid) TO authenticated;

-- 6. VERIFICATION PUBLIQUE PAR TOKEN --------------------------
CREATE TABLE IF NOT EXISTS public.cartes_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carte_id uuid REFERENCES public.cartes_membre(id) ON DELETE SET NULL,
  token uuid,
  resultat text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cartes_scans TO authenticated;
GRANT ALL ON public.cartes_scans TO service_role;
ALTER TABLE public.cartes_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scans_read" ON public.cartes_scans FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.verifier_carte(_token uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; v_res jsonb; v_droits boolean; v_cat text; v_nom text; v_statut text;
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
  ELSE
    SELECT initcap(left(COALESCE(a.prenom, a.nom), 1) || '. ' || a.nom), cat.nom, a.statut::text
      INTO v_nom, v_cat, v_statut
      FROM public.adherents a
      LEFT JOIN public.categories_adhesion cat ON cat.id = COALESCE(c.categorie_id, a.categorie_id)
      WHERE a.id = c.adherent_id;
    v_droits := public.droits_ouverts(c.adherent_id);
  END IF;

  v_res := jsonb_build_object(
    'valide', c.statut = 'active' AND (c.date_expiration IS NULL OR c.date_expiration >= current_date),
    'type', c.type_carte,
    'numero', c.numero,
    'titulaire', v_nom,
    'categorie', v_cat,
    'statut_carte', c.statut,
    'statut_titulaire', v_statut,
    'date_emission', c.date_emission,
    'date_expiration', c.date_expiration,
    'droits_ouverts', COALESCE(v_droits, false),
    'verifie_le', now()
  );

  INSERT INTO public.cartes_scans (carte_id, token, resultat)
  VALUES (c.id, _token, CASE WHEN (v_res ->> 'valide')::boolean THEN 'valide' ELSE 'invalide' END);

  RETURN v_res;
END; $$;

GRANT EXECUTE ON FUNCTION public.verifier_carte(uuid) TO anon, authenticated;

-- 7. PARAMETRES ------------------------------------------------
INSERT INTO public.app_parametres (cle, valeur, categorie, libelle, is_public)
VALUES
  ('carte.prix_reimpression_usd', '5'::jsonb, 'finance', 'Frais de reimpression de carte (USD)', true),
  ('carte.delai_reimpression_jours', '30'::jsonb, 'carte', 'Delai minimum entre deux reimpressions (jours)', false)
ON CONFLICT (cle) DO NOTHING;

-- 8. Backfill des cartes existantes ---------------------------
UPDATE public.cartes_membre SET statut = CASE WHEN is_active THEN 'active' ELSE 'annulee' END
 WHERE statut IS NULL;
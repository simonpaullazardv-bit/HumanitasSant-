-- ============================================================
-- PROCESSUS COMPLET DE PRISE EN CHARGE (etapes 1 a 12)
-- ============================================================

-- 1. Colonnes complementaires sur les prises en charge
ALTER TABLE public.prises_en_charge
  ADD COLUMN IF NOT EXISTS info_requise boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS info_demandee text,
  ADD COLUMN IF NOT EXISTS montant_realise_usd numeric(12,2),
  ADD COLUMN IF NOT EXISTS date_execution timestamptz;

-- 2. Historique des decisions du medecin conseil (etape 6)
CREATE TABLE IF NOT EXISTS public.pec_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prise_en_charge_id uuid NOT NULL REFERENCES public.prises_en_charge(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('mise_en_revue','validee','refusee','info_requise','executee','annulee')),
  ancien_statut text,
  nouveau_statut text,
  motif text,
  montant_approuve_usd numeric(12,2),
  decide_par uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pec_decisions_idx ON public.pec_decisions (prise_en_charge_id, created_at DESC);

GRANT SELECT ON public.pec_decisions TO authenticated;
GRANT ALL ON public.pec_decisions TO service_role;
ALTER TABLE public.pec_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lit les decisions" ON public.pec_decisions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Partenaire lit les decisions de ses pec" ON public.pec_decisions
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.prises_en_charge p
    WHERE p.id = prise_en_charge_id AND public.appartient_partenaire(auth.uid(), p.partenaire_id)
  ));

-- 3. Prestations realisees (etape 7) : minimum necessaire
CREATE TABLE IF NOT EXISTS public.pec_prestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prise_en_charge_id uuid NOT NULL REFERENCES public.prises_en_charge(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('symptome','consultation','acte','examen','medicament','hospitalisation','autre')),
  libelle text NOT NULL,
  quantite integer NOT NULL DEFAULT 1 CHECK (quantite > 0),
  montant_unitaire_usd numeric(12,2) NOT NULL DEFAULT 0,
  montant_usd numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pec_prestations_idx ON public.pec_prestations (prise_en_charge_id);

GRANT SELECT ON public.pec_prestations TO authenticated;
GRANT ALL ON public.pec_prestations TO service_role;
ALTER TABLE public.pec_prestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lit les prestations" ON public.pec_prestations
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Partenaire lit ses prestations" ON public.pec_prestations
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.prises_en_charge p
    WHERE p.id = prise_en_charge_id AND public.appartient_partenaire(auth.uid(), p.partenaire_id)
  ));
CREATE POLICY "Adherent lit ses prestations" ON public.pec_prestations
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.prises_en_charge p
    WHERE p.id = prise_en_charge_id AND public.owns_adherent(auth.uid(), p.adherent_id)
  ));

-- 4. Notifications internes par role (etapes 5, 9, 10, 12)
CREATE TABLE IF NOT EXISTS public.notifications_internes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire_role public.app_role NOT NULL,
  titre text NOT NULL,
  message text NOT NULL,
  niveau text NOT NULL DEFAULT 'info' CHECK (niveau IN ('info','succes','alerte','critique')),
  entite text,
  entite_id uuid,
  lien text,
  is_lue boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_internes_idx
  ON public.notifications_internes (destinataire_role, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications_internes TO authenticated;
GRANT ALL ON public.notifications_internes TO service_role;
ALTER TABLE public.notifications_internes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role destinataire lit ses notifications" ON public.notifications_internes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), destinataire_role) OR public.is_admin(auth.uid()));
CREATE POLICY "Role destinataire marque ses notifications" ON public.notifications_internes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), destinataire_role) OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), destinataire_role) OR public.is_admin(auth.uid()));

-- 5. Ordres de remboursement (etapes 9 a 12) : 1 facture = 1 ordre
CREATE SEQUENCE IF NOT EXISTS public.ordre_numero_seq;

CREATE TABLE IF NOT EXISTS public.ordres_remboursement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  facture_id uuid NOT NULL UNIQUE REFERENCES public.factures_partenaires(id) ON DELETE RESTRICT,
  partenaire_id uuid NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  prise_en_charge_id uuid REFERENCES public.prises_en_charge(id) ON DELETE SET NULL,
  adherent_id uuid REFERENCES public.adherents(id) ON DELETE SET NULL,
  montant_usd numeric(12,2) NOT NULL CHECK (montant_usd > 0),
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','valide','rejete','paye')),
  avis_medical text,
  controle_par uuid REFERENCES auth.users(id),
  controle_le timestamptz,
  valide_par uuid REFERENCES auth.users(id),
  valide_le timestamptz,
  paye_par uuid REFERENCES auth.users(id),
  paye_le timestamptz,
  mode_paiement text,
  reference_paiement text,
  motif_rejet text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ordres_partenaire_idx ON public.ordres_remboursement (partenaire_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ordres_reference_paiement_key
  ON public.ordres_remboursement (reference_paiement) WHERE reference_paiement IS NOT NULL;

GRANT SELECT ON public.ordres_remboursement TO authenticated;
GRANT ALL ON public.ordres_remboursement TO service_role;
ALTER TABLE public.ordres_remboursement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lit les ordres" ON public.ordres_remboursement
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Partenaire lit ses ordres" ON public.ordres_remboursement
  FOR SELECT TO authenticated USING (public.appartient_partenaire(auth.uid(), partenaire_id));

-- Numerotation + immuabilite d'un ordre paye
CREATE OR REPLACE FUNCTION public.set_ordre_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := 'ORD-' || to_char(now(), 'YYYYMM') || '-'
      || lpad(nextval('public.ordre_numero_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_ordre_numero ON public.ordres_remboursement;
CREATE TRIGGER trg_ordre_numero BEFORE INSERT ON public.ordres_remboursement
  FOR EACH ROW EXECUTE FUNCTION public.set_ordre_numero();

CREATE OR REPLACE FUNCTION public.protect_ordre_paye()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Un ordre de remboursement ne peut pas etre supprime.';
  END IF;
  IF OLD.statut = 'paye' THEN
    RAISE EXCEPTION 'Ordre % deja paye : aucune modification possible (anti double remboursement).', OLD.numero
      USING ERRCODE = 'check_violation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_ordre_protect ON public.ordres_remboursement;
CREATE TRIGGER trg_ordre_protect BEFORE UPDATE OR DELETE ON public.ordres_remboursement
  FOR EACH ROW EXECUTE FUNCTION public.protect_ordre_paye();

-- Une facture payee ne peut plus repasser en paiement
CREATE OR REPLACE FUNCTION public.protect_facture_payee()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.statut = 'payee' AND NEW.statut = 'payee'
     AND NEW.montant_paye_usd IS DISTINCT FROM OLD.montant_paye_usd THEN
    RAISE EXCEPTION 'Facture % deja payee : double remboursement interdit.', OLD.numero
      USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.statut = 'payee' AND NEW.statut <> 'payee' THEN
    RAISE EXCEPTION 'Une facture payee ne peut pas changer de statut.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_facture_protect ON public.factures_partenaires;
CREATE TRIGGER trg_facture_protect BEFORE UPDATE ON public.factures_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.protect_facture_payee();

-- 6. Plafond disponible d'un adherent (annee civile)
CREATE OR REPLACE FUNCTION public.plafond_disponible(_adherent_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_plafond numeric; v_consomme numeric; v_engage numeric;
BEGIN
  SELECT cat.plafond_usd INTO v_plafond
    FROM public.adherents a
    LEFT JOIN public.categories_adhesion cat ON cat.id = a.categorie_id
   WHERE a.id = _adherent_id;

  SELECT COALESCE(sum(o.montant_usd), 0) INTO v_consomme
    FROM public.ordres_remboursement o
   WHERE o.adherent_id = _adherent_id AND o.statut = 'paye'
     AND date_trunc('year', o.paye_le) = date_trunc('year', now());

  SELECT COALESCE(sum(COALESCE(p.montant_approuve_usd, p.montant_estime_usd)), 0) INTO v_engage
    FROM public.prises_en_charge p
   WHERE p.adherent_id = _adherent_id
     AND p.statut IN ('approuvee','executee')
     AND date_trunc('year', p.created_at) = date_trunc('year', now());

  RETURN jsonb_build_object(
    'plafond_annuel_usd', v_plafond,
    'consomme_usd', v_consomme,
    'engage_usd', v_engage,
    'disponible_usd', CASE WHEN v_plafond IS NULL THEN NULL
                           ELSE greatest(v_plafond - v_consomme - v_engage, 0) END
  );
END; $$;

-- 7. Verification complete d'eligibilite (etapes 2 et 3)
CREATE OR REPLACE FUNCTION public.partenaire_eligibilite(
  _partenaire_id uuid,
  _token uuid DEFAULT NULL,
  _matricule text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_contrat_id uuid; v_contrat record; v_carte record; a record; cat record;
  v_plafond jsonb; v_motifs text[] := '{}'; v_droits boolean; v_cot int;
  v_exclusions jsonb; v_conditions jsonb; v_eligible boolean;
BEGIN
  IF NOT public.appartient_partenaire(auth.uid(), _partenaire_id) AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Acces refuse.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_contrat_id := public.contrat_actif_partenaire(_partenaire_id);
  IF v_contrat_id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'motifs', to_jsonb(ARRAY['Aucun contrat partenaire valide']));
  END IF;
  SELECT * INTO v_contrat FROM public.contrats_partenaires WHERE id = v_contrat_id;

  IF _token IS NOT NULL THEN
    SELECT * INTO v_carte FROM public.cartes_membre WHERE qr_token = _token;
  ELSIF _matricule IS NOT NULL THEN
    SELECT c.* INTO v_carte
      FROM public.cartes_membre c
      JOIN public.adherents ad ON ad.id = c.adherent_id
     WHERE upper(btrim(ad.matricule)) = upper(btrim(_matricule))
       AND c.statut = 'active'
     ORDER BY c.date_emission DESC LIMIT 1;
  END IF;

  IF v_carte.id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'motifs', to_jsonb(ARRAY['Carte ou numero Humanitas introuvable']));
  END IF;

  SELECT * INTO a FROM public.adherents WHERE id = v_carte.adherent_id;
  IF a.id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'motifs', to_jsonb(ARRAY['Carte non rattachee a un adherent']));
  END IF;

  SELECT * INTO cat FROM public.categories_adhesion
   WHERE id = COALESCE(v_carte.categorie_id, a.categorie_id);

  IF v_carte.statut <> 'active' THEN v_motifs := v_motifs || 'Carte inactive'; END IF;
  IF v_carte.date_expiration IS NOT NULL AND v_carte.date_expiration < current_date THEN
    v_motifs := v_motifs || 'Carte expiree';
  END IF;
  IF a.statut <> 'actif' THEN v_motifs := v_motifs || ('Statut adherent : ' || a.statut::text); END IF;

  SELECT count(DISTINCT periode) INTO v_cot FROM public.paiements
   WHERE adherent_id = a.id AND statut = 'valide' AND type_operation = 'cotisation' AND periode IS NOT NULL;

  v_droits := public.droits_ouverts(a.id);
  IF NOT v_droits THEN v_motifs := v_motifs || 'Droits non ouverts (activation incomplete)'; END IF;

  IF EXISTS (SELECT 1 FROM public.cotisations
              WHERE adherent_id = a.id AND statut IN ('en_retard','partielle','due')
                AND echeance < current_date) THEN
    v_motifs := v_motifs || 'Cotisation en retard';
  END IF;

  v_plafond := public.plafond_disponible(a.id);
  IF (v_plafond ->> 'disponible_usd') IS NOT NULL
     AND (v_plafond ->> 'disponible_usd')::numeric <= 0 THEN
    v_motifs := v_motifs || 'Plafond annuel epuise';
  END IF;

  v_exclusions := COALESCE(cat.conditions -> 'exclusions', '[]'::jsonb);
  v_conditions := COALESCE(cat.conditions, '{}'::jsonb);
  v_eligible := array_length(v_motifs, 1) IS NULL;

  RETURN jsonb_build_object(
    'eligible', v_eligible,
    'motifs', to_jsonb(v_motifs),
    'adherent_id', a.id,
    'matricule', a.matricule,
    'titulaire', initcap(left(COALESCE(a.prenom, a.nom), 1) || '. ' || a.nom),
    'statut_adherent', a.statut,
    'carte', jsonb_build_object(
      'id', v_carte.id, 'numero', v_carte.numero, 'statut', v_carte.statut,
      'date_expiration', v_carte.date_expiration),
    'categorie', jsonb_build_object(
      'id', cat.id, 'nom', cat.nom, 'taux_couverture', cat.taux_couverture,
      'prestations_autorisees', cat.prestations_autorisees),
    'cotisations', jsonb_build_object('mensualites_validees', v_cot, 'droits_ouverts', v_droits),
    'plafond', v_plafond,
    'contrat', jsonb_build_object(
      'id', v_contrat.id, 'numero', v_contrat.numero, 'date_fin', v_contrat.date_fin,
      'taux_couverture', v_contrat.taux_couverture,
      'prestations_autorisees', v_contrat.prestations_autorisees,
      'plafond_acte_usd', v_contrat.plafond_acte_usd),
    'exclusions', v_exclusions,
    'conditions_particulieres', v_conditions,
    'verifie_le', now()
  );
END; $$;

REVOKE EXECUTE ON FUNCTION public.partenaire_eligibilite(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partenaire_eligibilite(uuid, uuid, text) TO authenticated;

-- 8. Notification du medecin conseil a la creation d'une PEC (etape 5)
CREATE OR REPLACE FUNCTION public.notifier_medecin_conseil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_nom text;
BEGIN
  SELECT nom INTO v_nom FROM public.partenaires WHERE id = NEW.partenaire_id;
  INSERT INTO public.notifications_internes (destinataire_role, titre, message, niveau, entite, entite_id, lien)
  VALUES ('medecin_conseil', 'Nouvelle demande de prise en charge',
          COALESCE(v_nom, 'Partenaire') || ' a soumis la demande ' || NEW.numero || ' : ' || NEW.motif,
          'alerte', 'prise_en_charge', NEW.id, '/portail/prises-en-charge');
  INSERT INTO public.pec_decisions (prise_en_charge_id, decision, nouveau_statut, motif, decide_par)
  VALUES (NEW.id, 'mise_en_revue', NEW.statut::text, 'Demande soumise par le partenaire', NEW.created_by);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_pec_notify_medecin ON public.prises_en_charge;
CREATE TRIGGER trg_pec_notify_medecin AFTER INSERT ON public.prises_en_charge
  FOR EACH ROW EXECUTE FUNCTION public.notifier_medecin_conseil();

-- 9. Decision du medecin conseil (etape 6)
CREATE OR REPLACE FUNCTION public.pec_decider(
  _pec_id uuid, _decision text, _motif text DEFAULT NULL, _montant numeric DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p record; v_new public.statut_prise_en_charge; v_plafond jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'medecin_conseil') OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Seul le medecin conseil peut decider.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO p FROM public.prises_en_charge WHERE id = _pec_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prise en charge introuvable.'; END IF;
  IF p.statut IN ('executee','annulee') THEN
    RAISE EXCEPTION 'Decision impossible : la demande est %.', p.statut USING ERRCODE = 'check_violation';
  END IF;

  IF _decision = 'validee' THEN
    v_plafond := public.plafond_disponible(p.adherent_id);
    IF (v_plafond ->> 'disponible_usd') IS NOT NULL
       AND COALESCE(_montant, p.montant_estime_usd) > (v_plafond ->> 'disponible_usd')::numeric THEN
      RAISE EXCEPTION 'Montant superieur au plafond disponible (% USD).', v_plafond ->> 'disponible_usd'
        USING ERRCODE = 'check_violation';
    END IF;
    v_new := 'approuvee';
  ELSIF _decision = 'refusee' THEN v_new := 'refusee';
  ELSIF _decision = 'info_requise' THEN v_new := 'en_revue';
  ELSIF _decision = 'mise_en_revue' THEN v_new := 'en_revue';
  ELSE RAISE EXCEPTION 'Decision inconnue : %.', _decision USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.prises_en_charge SET
    statut = v_new,
    montant_approuve_usd = CASE WHEN _decision = 'validee'
                                THEN COALESCE(_montant, montant_estime_usd) ELSE montant_approuve_usd END,
    decision_motif = _motif,
    decide_par = auth.uid(),
    decide_le = now(),
    info_requise = (_decision = 'info_requise'),
    info_demandee = CASE WHEN _decision = 'info_requise' THEN _motif ELSE NULL END
  WHERE id = _pec_id;

  INSERT INTO public.pec_decisions
    (prise_en_charge_id, decision, ancien_statut, nouveau_statut, motif, montant_approuve_usd, decide_par)
  VALUES (_pec_id, _decision, p.statut::text, v_new::text, _motif,
          CASE WHEN _decision = 'validee' THEN COALESCE(_montant, p.montant_estime_usd) END, auth.uid());

  RETURN jsonb_build_object('id', _pec_id, 'statut', v_new, 'decision', _decision);
END; $$;

REVOKE EXECUTE ON FUNCTION public.pec_decider(uuid, text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pec_decider(uuid, text, text, numeric) TO authenticated;

-- 10. Enregistrement des prestations realisees (etape 7)
CREATE OR REPLACE FUNCTION public.pec_enregistrer_prestations(_pec_id uuid, _prestations jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p record; item jsonb; v_total numeric := 0; v_autorisees jsonb;
BEGIN
  SELECT * INTO p FROM public.prises_en_charge WHERE id = _pec_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prise en charge introuvable.'; END IF;
  IF NOT (public.appartient_partenaire(auth.uid(), p.partenaire_id) OR public.is_staff(auth.uid())) THEN
    RAISE EXCEPTION 'Acces refuse.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p.statut <> 'approuvee' THEN
    RAISE EXCEPTION 'Seule une prise en charge approuvee peut etre executee (statut actuel : %).', p.statut
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT prestations_autorisees INTO v_autorisees FROM public.contrats_partenaires WHERE id = p.contrat_id;

  FOR item IN SELECT * FROM jsonb_array_elements(_prestations) LOOP
    IF jsonb_array_length(COALESCE(v_autorisees, '[]'::jsonb)) > 0
       AND NOT (v_autorisees ? (item ->> 'type')) AND (item ->> 'type') <> 'symptome' THEN
      RAISE EXCEPTION 'Prestation « % » non autorisee par le contrat.', item ->> 'type'
        USING ERRCODE = 'check_violation';
    END IF;
    INSERT INTO public.pec_prestations
      (prise_en_charge_id, type, libelle, quantite, montant_unitaire_usd, montant_usd, notes, created_by)
    VALUES (_pec_id, item ->> 'type', item ->> 'libelle',
            COALESCE((item ->> 'quantite')::int, 1),
            COALESCE((item ->> 'montant_unitaire_usd')::numeric, 0),
            COALESCE((item ->> 'quantite')::int, 1) * COALESCE((item ->> 'montant_unitaire_usd')::numeric, 0),
            item ->> 'notes', auth.uid());
    v_total := v_total + COALESCE((item ->> 'quantite')::int, 1)
                        * COALESCE((item ->> 'montant_unitaire_usd')::numeric, 0);
  END LOOP;

  UPDATE public.prises_en_charge
     SET statut = 'executee', montant_realise_usd = v_total, date_execution = now()
   WHERE id = _pec_id;

  INSERT INTO public.pec_decisions (prise_en_charge_id, decision, ancien_statut, nouveau_statut, motif, decide_par)
  VALUES (_pec_id, 'executee', p.statut::text, 'executee', 'Prestations realisees', auth.uid());

  INSERT INTO public.notifications_internes (destinataire_role, titre, message, entite, entite_id, lien)
  VALUES ('medecin_conseil', 'Prestation realisee',
          'La prise en charge ' || p.numero || ' a ete executee pour ' || v_total || ' USD.',
          'prise_en_charge', _pec_id, '/portail/prises-en-charge');

  RETURN jsonb_build_object('id', _pec_id, 'montant_realise_usd', v_total);
END; $$;

REVOKE EXECUTE ON FUNCTION public.pec_enregistrer_prestations(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pec_enregistrer_prestations(uuid, jsonb) TO authenticated;

-- 11. Notification finance/medecin a la soumission d'une facture (etape 8)
CREATE OR REPLACE FUNCTION public.notifier_facture_soumise()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.notifications_internes (destinataire_role, titre, message, entite, entite_id, lien)
  VALUES ('medecin_conseil', 'Facture a controler',
          'Facture ' || NEW.numero || ' de ' || NEW.montant_usd || ' USD a verifier.',
          'facture', NEW.id, '/portail/remboursements');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_facture_notify ON public.factures_partenaires;
CREATE TRIGGER trg_facture_notify AFTER INSERT ON public.factures_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.notifier_facture_soumise();

-- 12. Controle medical de la facture + creation de l'ordre (etape 9)
CREATE OR REPLACE FUNCTION public.facture_controler(
  _facture_id uuid, _decision text, _montant_valide numeric DEFAULT NULL, _avis text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE f record; p record; v_ordre uuid; v_montant numeric;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'medecin_conseil') OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Controle reserve au medecin conseil.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO f FROM public.factures_partenaires WHERE id = _facture_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Facture introuvable.'; END IF;
  IF f.statut IN ('payee','validee') THEN
    RAISE EXCEPTION 'Facture deja %.', f.statut USING ERRCODE = 'check_violation';
  END IF;

  IF _decision = 'rejetee' THEN
    UPDATE public.factures_partenaires
       SET statut = 'rejetee', motif_rejet = _avis, validee_par = auth.uid(), validee_le = now()
     WHERE id = _facture_id;
    RETURN jsonb_build_object('id', _facture_id, 'statut', 'rejetee');
  END IF;

  v_montant := COALESCE(_montant_valide, f.montant_usd);
  IF v_montant <= 0 THEN
    RAISE EXCEPTION 'Le montant valide doit etre positif.' USING ERRCODE = 'check_violation';
  END IF;

  IF f.prise_en_charge_id IS NOT NULL THEN
    SELECT * INTO p FROM public.prises_en_charge WHERE id = f.prise_en_charge_id;
    IF p.statut <> 'executee' THEN
      RAISE EXCEPTION 'La prestation liee n''est pas executee : controle impossible.'
        USING ERRCODE = 'check_violation';
    END IF;
    IF p.montant_approuve_usd IS NOT NULL AND v_montant > p.montant_approuve_usd THEN
      RAISE EXCEPTION 'Montant facture superieur au montant approuve (% USD).', p.montant_approuve_usd
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  UPDATE public.factures_partenaires
     SET statut = 'validee', montant_valide_usd = v_montant, validee_par = auth.uid(), validee_le = now()
   WHERE id = _facture_id;

  INSERT INTO public.ordres_remboursement
    (facture_id, partenaire_id, prise_en_charge_id, adherent_id, montant_usd,
     avis_medical, controle_par, controle_le)
  VALUES (_facture_id, f.partenaire_id, f.prise_en_charge_id, p.adherent_id, v_montant,
          _avis, auth.uid(), now())
  RETURNING id INTO v_ordre;

  INSERT INTO public.notifications_internes (destinataire_role, titre, message, entite, entite_id, lien)
  VALUES ('administrateur', 'Ordre de remboursement a valider',
          'Facture ' || f.numero || ' controlee : ' || v_montant || ' USD a autoriser.',
          'ordre', v_ordre, '/portail/remboursements');

  RETURN jsonb_build_object('facture_id', _facture_id, 'ordre_id', v_ordre, 'montant_usd', v_montant);
END; $$;

REVOKE EXECUTE ON FUNCTION public.facture_controler(uuid, text, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.facture_controler(uuid, text, numeric, text) TO authenticated;

-- 13. Validation administrative de l'ordre (etape 10)
CREATE OR REPLACE FUNCTION public.ordre_valider(_ordre_id uuid, _decision text DEFAULT 'valide', _motif text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Validation reservee a l''administration.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO o FROM public.ordres_remboursement WHERE id = _ordre_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ordre introuvable.'; END IF;
  IF o.statut <> 'en_attente' THEN
    RAISE EXCEPTION 'Ordre deja % : action impossible.', o.statut USING ERRCODE = 'check_violation';
  END IF;

  IF _decision = 'rejete' THEN
    UPDATE public.ordres_remboursement
       SET statut = 'rejete', motif_rejet = _motif, valide_par = auth.uid(), valide_le = now()
     WHERE id = _ordre_id;
    RETURN jsonb_build_object('id', _ordre_id, 'statut', 'rejete');
  END IF;

  UPDATE public.ordres_remboursement
     SET statut = 'valide', valide_par = auth.uid(), valide_le = now()
   WHERE id = _ordre_id;

  INSERT INTO public.notifications_internes (destinataire_role, titre, message, entite, entite_id, lien)
  VALUES ('financier', 'Paiement a executer',
          'Ordre ' || o.numero || ' autorise : ' || o.montant_usd || ' USD a payer.',
          'ordre', _ordre_id, '/portail/remboursements');

  RETURN jsonb_build_object('id', _ordre_id, 'statut', 'valide');
END; $$;

REVOKE EXECUTE ON FUNCTION public.ordre_valider(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ordre_valider(uuid, text, text) TO authenticated;

-- 14. Paiement comptable atomique (etapes 11 et 12) - anti double remboursement
CREATE OR REPLACE FUNCTION public.ordre_payer(
  _ordre_id uuid, _mode text, _reference text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o record; f record;
BEGIN
  IF NOT (public.can_manage_finance(auth.uid())) THEN
    RAISE EXCEPTION 'Paiement reserve a la comptabilite.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO o FROM public.ordres_remboursement WHERE id = _ordre_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ordre introuvable.'; END IF;
  IF o.statut = 'paye' THEN
    RAISE EXCEPTION 'Ordre % deja paye : double remboursement interdit.', o.numero
      USING ERRCODE = 'check_violation';
  END IF;
  IF o.statut <> 'valide' THEN
    RAISE EXCEPTION 'Ordre non autorise au paiement (statut : %).', o.statut USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO f FROM public.factures_partenaires WHERE id = o.facture_id FOR UPDATE;
  IF f.statut = 'payee' THEN
    RAISE EXCEPTION 'Facture % deja payee : double remboursement interdit.', f.numero
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.ordres_remboursement
     SET statut = 'paye', paye_par = auth.uid(), paye_le = now(),
         mode_paiement = _mode, reference_paiement = _reference
   WHERE id = _ordre_id;

  UPDATE public.factures_partenaires
     SET statut = 'payee', montant_paye_usd = o.montant_usd, payee_le = now()
   WHERE id = o.facture_id;

  INSERT INTO public.operations_financieres
    (adherent_id, type_operation, affectation, sens, montant_usd, libelle, created_by)
  VALUES (o.adherent_id, 'remboursement_partenaire', 'fonds_mutuelle', 'debit', o.montant_usd,
          'Remboursement ' || o.numero || ' - facture ' || f.numero, auth.uid());

  INSERT INTO public.partenaire_notifications (partenaire_id, titre, message, niveau, lien)
  VALUES (o.partenaire_id, 'Facture payee',
          'La facture ' || f.numero || ' a ete reglee : ' || o.montant_usd || ' USD.',
          'succes', '/portail/espace-partenaire');

  INSERT INTO public.notifications_internes (destinataire_role, titre, message, entite, entite_id, lien)
  VALUES ('administrateur', 'Remboursement execute',
          'Ordre ' || o.numero || ' paye : ' || o.montant_usd || ' USD.',
          'ordre', _ordre_id, '/portail/remboursements');

  IF o.adherent_id IS NOT NULL THEN
    INSERT INTO public.adherent_historique (adherent_id, evenement, details, created_by)
    VALUES (o.adherent_id, 'remboursement_paye',
            jsonb_build_object('ordre', o.numero, 'facture', f.numero, 'montant_usd', o.montant_usd),
            auth.uid());
  END IF;

  RETURN jsonb_build_object('id', _ordre_id, 'statut', 'paye', 'montant_usd', o.montant_usd);
END; $$;

REVOKE EXECUTE ON FUNCTION public.ordre_payer(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ordre_payer(uuid, text, text) TO authenticated;
-- 1. Types
ALTER TYPE public.type_partenaire ADD VALUE IF NOT EXISTS 'structure_sanitaire';
ALTER TYPE public.type_partenaire ADD VALUE IF NOT EXISTS 'dispensaire';

DO $$ BEGIN
  CREATE TYPE public.statut_partenaire AS ENUM ('en_attente','actif','suspendu','resilie');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.statut_contrat AS ENUM ('brouillon','actif','suspendu','expire','resilie');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.statut_prise_en_charge AS ENUM ('soumise','en_revue','approuvee','refusee','executee','annulee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.statut_facture AS ENUM ('brouillon','soumise','validee','payee','rejetee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.type_document_partenaire AS ENUM ('convention','agrement','licence','rccm','identite','facture','autre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Fiche partenaire enrichie
CREATE SEQUENCE IF NOT EXISTS public.partenaire_numero_seq;

ALTER TABLE public.partenaires
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS responsable_nom text,
  ADD COLUMN IF NOT EXISTS responsable_fonction text,
  ADD COLUMN IF NOT EXISTS responsable_telephone text,
  ADD COLUMN IF NOT EXISTS responsable_email text,
  ADD COLUMN IF NOT EXISTS statut public.statut_partenaire NOT NULL DEFAULT 'actif',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.set_partenaire_numero()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := 'PAR-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.partenaire_numero_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_partenaires_numero ON public.partenaires;
CREATE TRIGGER trg_partenaires_numero BEFORE INSERT ON public.partenaires
  FOR EACH ROW EXECUTE FUNCTION public.set_partenaire_numero();

UPDATE public.partenaires
   SET numero = 'PAR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.partenaire_numero_seq')::text, 6, '0')
 WHERE numero IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS partenaires_numero_key ON public.partenaires(numero);

-- 3. Comptes rattaches a un partenaire
CREATE TABLE IF NOT EXISTS public.partenaire_membres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partenaire_id uuid NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fonction text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partenaire_id, user_id)
);
GRANT SELECT ON public.partenaire_membres TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partenaire_membres TO authenticated;
GRANT ALL ON public.partenaire_membres TO service_role;
ALTER TABLE public.partenaire_membres ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.partenaires_de(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT partenaire_id FROM public.partenaire_membres
   WHERE user_id = _user_id AND is_active;
$$;

CREATE OR REPLACE FUNCTION public.appartient_partenaire(_user_id uuid, _partenaire_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partenaire_membres
     WHERE user_id = _user_id AND partenaire_id = _partenaire_id AND is_active
  );
$$;

CREATE POLICY "Staff gere les comptes partenaires" ON public.partenaire_membres
  FOR ALL TO authenticated
  USING (public.can_manage_adherents(auth.uid()))
  WITH CHECK (public.can_manage_adherents(auth.uid()));

CREATE POLICY "Membre voit son rattachement" ON public.partenaire_membres
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. Documents partenaires
CREATE TABLE IF NOT EXISTS public.partenaire_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partenaire_id uuid NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  contrat_id uuid,
  type public.type_document_partenaire NOT NULL DEFAULT 'autre',
  nom text NOT NULL,
  bucket text NOT NULL DEFAULT 'medias',
  storage_path text NOT NULL,
  mime_type text,
  taille_octets bigint,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partenaire_documents TO authenticated;
GRANT ALL ON public.partenaire_documents TO service_role;
ALTER TABLE public.partenaire_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gere les documents partenaires" ON public.partenaire_documents
  FOR ALL TO authenticated
  USING (public.can_manage_adherents(auth.uid()))
  WITH CHECK (public.can_manage_adherents(auth.uid()));

CREATE POLICY "Partenaire voit ses documents" ON public.partenaire_documents
  FOR SELECT TO authenticated
  USING (public.appartient_partenaire(auth.uid(), partenaire_id));

-- 5. Historique partenaire
CREATE TABLE IF NOT EXISTS public.partenaire_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partenaire_id uuid NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  contrat_id uuid,
  evenement text NOT NULL,
  ancien_statut text,
  nouveau_statut text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.partenaire_historique TO authenticated;
GRANT ALL ON public.partenaire_historique TO service_role;
ALTER TABLE public.partenaire_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff lit l historique partenaire" ON public.partenaire_historique
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Partenaire lit son historique" ON public.partenaire_historique
  FOR SELECT TO authenticated USING (public.appartient_partenaire(auth.uid(), partenaire_id));
CREATE POLICY "Staff ecrit l historique partenaire" ON public.partenaire_historique
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- 6. Contrats
CREATE SEQUENCE IF NOT EXISTS public.contrat_numero_seq;

CREATE TABLE IF NOT EXISTS public.contrats_partenaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  partenaire_id uuid NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  objet text,
  date_debut date NOT NULL DEFAULT current_date,
  date_fin date,
  statut public.statut_contrat NOT NULL DEFAULT 'brouillon',
  prestations_autorisees jsonb NOT NULL DEFAULT '[]'::jsonb,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  plafond_acte_usd numeric(12,2),
  plafond_mensuel_usd numeric(12,2),
  plafond_annuel_usd numeric(12,2),
  taux_couverture smallint NOT NULL DEFAULT 80,
  signe_humanitas_par text,
  signe_humanitas_le timestamptz,
  signe_partenaire_par text,
  signe_partenaire_le timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS contrats_partenaires_numero_key ON public.contrats_partenaires(numero);
CREATE INDEX IF NOT EXISTS contrats_partenaires_partenaire_idx ON public.contrats_partenaires(partenaire_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrats_partenaires TO authenticated;
GRANT ALL ON public.contrats_partenaires TO service_role;
ALTER TABLE public.contrats_partenaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gere les contrats" ON public.contrats_partenaires
  FOR ALL TO authenticated
  USING (public.can_manage_adherents(auth.uid()))
  WITH CHECK (public.can_manage_adherents(auth.uid()));
CREATE POLICY "Partenaire lit ses contrats" ON public.contrats_partenaires
  FOR SELECT TO authenticated
  USING (public.appartient_partenaire(auth.uid(), partenaire_id));

CREATE OR REPLACE FUNCTION public.set_contrat_numero()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := 'CTR-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.contrat_numero_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_contrats_numero ON public.contrats_partenaires;
CREATE TRIGGER trg_contrats_numero BEFORE INSERT ON public.contrats_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.set_contrat_numero();

CREATE OR REPLACE FUNCTION public.check_contrat_dates()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.date_fin IS NOT NULL AND NEW.date_fin < NEW.date_debut THEN
    RAISE EXCEPTION 'La date de fin du contrat doit etre posterieure a la date de debut.'
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.statut = 'actif' AND NEW.date_fin IS NOT NULL AND NEW.date_fin < current_date THEN
    NEW.statut := 'expire';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_contrats_dates ON public.contrats_partenaires;
CREATE TRIGGER trg_contrats_dates BEFORE INSERT OR UPDATE ON public.contrats_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.check_contrat_dates();

DROP TRIGGER IF EXISTS trg_contrats_updated ON public.contrats_partenaires;
CREATE TRIGGER trg_contrats_updated BEFORE UPDATE ON public.contrats_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_partenaire_documents_updated ON public.partenaire_documents;
CREATE TRIGGER trg_partenaire_documents_updated BEFORE UPDATE ON public.partenaire_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_partenaire_membres_updated ON public.partenaire_membres;
CREATE TRIGGER trg_partenaire_membres_updated BEFORE UPDATE ON public.partenaire_membres
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partenaire_documents
  DROP CONSTRAINT IF EXISTS partenaire_documents_contrat_fk,
  ADD CONSTRAINT partenaire_documents_contrat_fk
  FOREIGN KEY (contrat_id) REFERENCES public.contrats_partenaires(id) ON DELETE SET NULL;

ALTER TABLE public.partenaire_historique
  DROP CONSTRAINT IF EXISTS partenaire_historique_contrat_fk,
  ADD CONSTRAINT partenaire_historique_contrat_fk
  FOREIGN KEY (contrat_id) REFERENCES public.contrats_partenaires(id) ON DELETE SET NULL;

-- Journalisation automatique partenaire + contrat
CREATE OR REPLACE FUNCTION public.audit_partenaire()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid; cid uuid;
BEGIN
  IF TG_TABLE_NAME = 'partenaires' THEN
    pid := COALESCE(NEW.id, OLD.id); cid := NULL;
  ELSE
    pid := COALESCE(NEW.partenaire_id, OLD.partenaire_id); cid := COALESCE(NEW.id, OLD.id);
  END IF;

  INSERT INTO public.partenaire_historique
    (partenaire_id, contrat_id, evenement, ancien_statut, nouveau_statut, details, created_by)
  VALUES (
    pid, cid, lower(TG_OP) || '_' || TG_TABLE_NAME,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.statut::text END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.statut::text END,
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    ),
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_audit_partenaires ON public.partenaires;
CREATE TRIGGER trg_audit_partenaires AFTER INSERT OR UPDATE ON public.partenaires
  FOR EACH ROW EXECUTE FUNCTION public.audit_partenaire();

DROP TRIGGER IF EXISTS trg_audit_contrats ON public.contrats_partenaires;
CREATE TRIGGER trg_audit_contrats AFTER INSERT OR UPDATE ON public.contrats_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.audit_partenaire();

-- Contrat valide ?
CREATE OR REPLACE FUNCTION public.contrat_valide(_contrat_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contrats_partenaires c
     WHERE c.id = _contrat_id
       AND c.statut = 'actif'
       AND c.date_debut <= current_date
       AND (c.date_fin IS NULL OR c.date_fin >= current_date)
  );
$$;

CREATE OR REPLACE FUNCTION public.contrat_actif_partenaire(_partenaire_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id FROM public.contrats_partenaires c
   WHERE c.partenaire_id = _partenaire_id
     AND c.statut = 'actif'
     AND c.date_debut <= current_date
     AND (c.date_fin IS NULL OR c.date_fin >= current_date)
   ORDER BY c.date_debut DESC LIMIT 1;
$$;

-- 7. Prises en charge
CREATE SEQUENCE IF NOT EXISTS public.pec_numero_seq;

CREATE TABLE IF NOT EXISTS public.prises_en_charge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  partenaire_id uuid NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  contrat_id uuid REFERENCES public.contrats_partenaires(id) ON DELETE SET NULL,
  adherent_id uuid REFERENCES public.adherents(id) ON DELETE SET NULL,
  beneficiaire_id uuid REFERENCES public.beneficiaires(id) ON DELETE SET NULL,
  carte_id uuid REFERENCES public.cartes_membre(id) ON DELETE SET NULL,
  motif text NOT NULL,
  prestations jsonb NOT NULL DEFAULT '[]'::jsonb,
  montant_estime_usd numeric(12,2) NOT NULL DEFAULT 0,
  montant_approuve_usd numeric(12,2),
  statut public.statut_prise_en_charge NOT NULL DEFAULT 'soumise',
  decision_motif text,
  decide_par uuid REFERENCES auth.users(id),
  decide_le timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS prises_en_charge_numero_key ON public.prises_en_charge(numero);
CREATE INDEX IF NOT EXISTS prises_en_charge_partenaire_idx ON public.prises_en_charge(partenaire_id);
CREATE INDEX IF NOT EXISTS prises_en_charge_adherent_idx ON public.prises_en_charge(adherent_id);

GRANT SELECT, INSERT, UPDATE ON public.prises_en_charge TO authenticated;
GRANT ALL ON public.prises_en_charge TO service_role;
ALTER TABLE public.prises_en_charge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gere les prises en charge" ON public.prises_en_charge
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Partenaire lit ses prises en charge" ON public.prises_en_charge
  FOR SELECT TO authenticated
  USING (public.appartient_partenaire(auth.uid(), partenaire_id));
CREATE POLICY "Partenaire cree ses prises en charge" ON public.prises_en_charge
  FOR INSERT TO authenticated
  WITH CHECK (public.appartient_partenaire(auth.uid(), partenaire_id));
CREATE POLICY "Adherent lit ses prises en charge" ON public.prises_en_charge
  FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id));

CREATE OR REPLACE FUNCTION public.set_pec_numero()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := 'PEC-' || to_char(now(), 'YYYYMM') || '-' ||
      lpad(nextval('public.pec_numero_seq')::text, 6, '0');
  END IF;
  NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_pec_numero ON public.prises_en_charge;
CREATE TRIGGER trg_pec_numero BEFORE INSERT ON public.prises_en_charge
  FOR EACH ROW EXECUTE FUNCTION public.set_pec_numero();

-- Refus si contrat invalide / partenaire inactif
CREATE OR REPLACE FUNCTION public.check_pec_contrat()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contrat uuid; v_statut public.statut_partenaire; v_plafond numeric;
BEGIN
  SELECT statut INTO v_statut FROM public.partenaires WHERE id = NEW.partenaire_id;
  IF v_statut IS DISTINCT FROM 'actif' THEN
    RAISE EXCEPTION 'Partenaire non actif : prise en charge refusee.' USING ERRCODE = 'check_violation';
  END IF;

  v_contrat := COALESCE(NEW.contrat_id, public.contrat_actif_partenaire(NEW.partenaire_id));
  IF v_contrat IS NULL OR NOT public.contrat_valide(v_contrat) THEN
    RAISE EXCEPTION 'Aucun contrat valide : un contrat expire ou inactif ne peut pas etre utilise.'
      USING ERRCODE = 'check_violation';
  END IF;
  NEW.contrat_id := v_contrat;

  SELECT plafond_acte_usd INTO v_plafond FROM public.contrats_partenaires WHERE id = v_contrat;
  IF v_plafond IS NOT NULL AND NEW.montant_estime_usd > v_plafond THEN
    RAISE EXCEPTION 'Montant superieur au plafond par acte du contrat (% USD).', v_plafond
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_pec_contrat ON public.prises_en_charge;
CREATE TRIGGER trg_pec_contrat BEFORE INSERT ON public.prises_en_charge
  FOR EACH ROW EXECUTE FUNCTION public.check_pec_contrat();

DROP TRIGGER IF EXISTS trg_pec_updated ON public.prises_en_charge;
CREATE TRIGGER trg_pec_updated BEFORE UPDATE ON public.prises_en_charge
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Factures partenaires
CREATE SEQUENCE IF NOT EXISTS public.facture_numero_seq;

CREATE TABLE IF NOT EXISTS public.factures_partenaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  reference_partenaire text,
  partenaire_id uuid NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  contrat_id uuid REFERENCES public.contrats_partenaires(id) ON DELETE SET NULL,
  prise_en_charge_id uuid REFERENCES public.prises_en_charge(id) ON DELETE SET NULL,
  periode date,
  montant_usd numeric(12,2) NOT NULL DEFAULT 0,
  montant_valide_usd numeric(12,2),
  montant_paye_usd numeric(12,2) NOT NULL DEFAULT 0,
  statut public.statut_facture NOT NULL DEFAULT 'soumise',
  motif_rejet text,
  document_path text,
  soumise_par uuid REFERENCES auth.users(id),
  validee_par uuid REFERENCES auth.users(id),
  validee_le timestamptz,
  payee_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS factures_partenaires_numero_key ON public.factures_partenaires(numero);
CREATE INDEX IF NOT EXISTS factures_partenaires_partenaire_idx ON public.factures_partenaires(partenaire_id);

GRANT SELECT, INSERT, UPDATE ON public.factures_partenaires TO authenticated;
GRANT ALL ON public.factures_partenaires TO service_role;
ALTER TABLE public.factures_partenaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gere les factures partenaires" ON public.factures_partenaires
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()) OR public.can_manage_adherents(auth.uid()));
CREATE POLICY "Partenaire lit ses factures" ON public.factures_partenaires
  FOR SELECT TO authenticated
  USING (public.appartient_partenaire(auth.uid(), partenaire_id));
CREATE POLICY "Partenaire soumet ses factures" ON public.factures_partenaires
  FOR INSERT TO authenticated
  WITH CHECK (public.appartient_partenaire(auth.uid(), partenaire_id));

CREATE OR REPLACE FUNCTION public.set_facture_numero()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contrat uuid;
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := 'FAC-' || to_char(now(), 'YYYYMM') || '-' ||
      lpad(nextval('public.facture_numero_seq')::text, 6, '0');
  END IF;
  NEW.soumise_par := COALESCE(NEW.soumise_par, auth.uid());

  v_contrat := COALESCE(NEW.contrat_id, public.contrat_actif_partenaire(NEW.partenaire_id));
  IF v_contrat IS NULL OR NOT public.contrat_valide(v_contrat) THEN
    RAISE EXCEPTION 'Aucun contrat valide : facturation impossible avec un contrat expire.'
      USING ERRCODE = 'check_violation';
  END IF;
  NEW.contrat_id := v_contrat;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_facture_numero ON public.factures_partenaires;
CREATE TRIGGER trg_facture_numero BEFORE INSERT ON public.factures_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.set_facture_numero();

DROP TRIGGER IF EXISTS trg_facture_updated ON public.factures_partenaires;
CREATE TRIGGER trg_facture_updated BEFORE UPDATE ON public.factures_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Notifications partenaires
CREATE TABLE IF NOT EXISTS public.partenaire_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partenaire_id uuid NOT NULL REFERENCES public.partenaires(id) ON DELETE CASCADE,
  titre text NOT NULL,
  message text NOT NULL,
  niveau text NOT NULL DEFAULT 'info',
  lien text,
  is_lue boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partenaire_notifications_idx ON public.partenaire_notifications(partenaire_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.partenaire_notifications TO authenticated;
GRANT ALL ON public.partenaire_notifications TO service_role;
ALTER TABLE public.partenaire_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gere les notifications partenaires" ON public.partenaire_notifications
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Partenaire lit ses notifications" ON public.partenaire_notifications
  FOR SELECT TO authenticated
  USING (public.appartient_partenaire(auth.uid(), partenaire_id));
CREATE POLICY "Partenaire marque ses notifications" ON public.partenaire_notifications
  FOR UPDATE TO authenticated
  USING (public.appartient_partenaire(auth.uid(), partenaire_id))
  WITH CHECK (public.appartient_partenaire(auth.uid(), partenaire_id));

-- 10. Notification automatique sur decision de prise en charge / facture
CREATE OR REPLACE FUNCTION public.notifier_partenaire_pec()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.statut IS DISTINCT FROM OLD.statut THEN
    INSERT INTO public.partenaire_notifications (partenaire_id, titre, message, niveau)
    VALUES (NEW.partenaire_id,
            'Prise en charge ' || NEW.numero,
            'Statut mis a jour : ' || NEW.statut::text ||
              COALESCE(' — ' || NEW.decision_motif, ''),
            CASE WHEN NEW.statut = 'refusee' THEN 'alerte' ELSE 'info' END);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_pec_notify ON public.prises_en_charge;
CREATE TRIGGER trg_pec_notify AFTER UPDATE ON public.prises_en_charge
  FOR EACH ROW EXECUTE FUNCTION public.notifier_partenaire_pec();

-- 11. Verification adherent depuis l'espace partenaire (aucune donnee sensible)
CREATE OR REPLACE FUNCTION public.partenaire_verifier_adherent(_partenaire_id uuid, _token uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_res jsonb;
BEGIN
  IF NOT public.appartient_partenaire(auth.uid(), _partenaire_id) THEN
    RAISE EXCEPTION 'Acces refuse.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF public.contrat_actif_partenaire(_partenaire_id) IS NULL THEN
    RAISE EXCEPTION 'Aucun contrat valide : verification indisponible.' USING ERRCODE = 'check_violation';
  END IF;

  SELECT jsonb_build_object(
    'valide', c.statut = 'active' AND (c.date_expiration IS NULL OR c.date_expiration >= current_date),
    'numero', c.numero,
    'type', c.type_carte,
    'adherent_id', c.adherent_id,
    'titulaire', initcap(left(COALESCE(a.prenom, a.nom), 1) || '. ' || a.nom),
    'categorie', cat.nom,
    'taux_couverture', cat.taux_couverture,
    'plafond_usd', cat.plafond_usd,
    'date_expiration', c.date_expiration,
    'droits_ouverts', public.droits_ouverts(c.adherent_id)
  ) INTO v_res
  FROM public.cartes_membre c
  LEFT JOIN public.adherents a ON a.id = c.adherent_id
  LEFT JOIN public.categories_adhesion cat ON cat.id = COALESCE(c.categorie_id, a.categorie_id)
  WHERE c.qr_token = _token;

  RETURN COALESCE(v_res, jsonb_build_object('valide', false, 'motif', 'Carte inconnue'));
END; $$;

REVOKE EXECUTE ON FUNCTION public.partenaire_verifier_adherent(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partenaire_verifier_adherent(uuid, uuid) TO authenticated;
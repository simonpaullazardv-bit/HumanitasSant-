-- 1. Nouveaux statuts
ALTER TYPE public.statut_adherent ADD VALUE IF NOT EXISTS 'inactif';
ALTER TYPE public.statut_adherent ADD VALUE IF NOT EXISTS 'decede';

-- 2. Type d'adhesion
DO $$ BEGIN
  CREATE TYPE public.type_adhesion AS ENUM ('individuel','familial','collectif');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.type_document AS ENUM ('piece_identite','photo','justificatif_domicile','acte_naissance','contrat','certificat_medical','autre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Champs dossier adherent
ALTER TABLE public.adherents
  ADD COLUMN IF NOT EXISTS type_adhesion public.type_adhesion NOT NULL DEFAULT 'individuel',
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS etat_civil text,
  ADD COLUMN IF NOT EXISTS nationalite text,
  ADD COLUMN IF NOT EXISTS piece_type text,
  ADD COLUMN IF NOT EXISTS piece_numero text,
  ADD COLUMN IF NOT EXISTS contact_urgence_nom text,
  ADD COLUMN IF NOT EXISTS contact_urgence_telephone text,
  ADD COLUMN IF NOT EXISTS date_expiration date;

CREATE UNIQUE INDEX IF NOT EXISTS adherents_matricule_key ON public.adherents (matricule);

-- 4. Numero unique jamais reutilise
CREATE SEQUENCE IF NOT EXISTS public.matricule_seq START 1;

CREATE TABLE IF NOT EXISTS public.matricules_emis (
  matricule text PRIMARY KEY,
  adherent_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matricules_emis TO authenticated;
GRANT ALL ON public.matricules_emis TO service_role;
ALTER TABLE public.matricules_emis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS matricules_read ON public.matricules_emis;
CREATE POLICY matricules_read ON public.matricules_emis FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.next_matricule()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE candidate text;
BEGIN
  LOOP
    candidate := 'HUM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.matricule_seq')::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.matricules_emis WHERE matricule = candidate);
  END LOOP;
  INSERT INTO public.matricules_emis (matricule) VALUES (candidate);
  RETURN candidate;
END; $$;

CREATE OR REPLACE FUNCTION public.set_adherent_matricule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.matricule IS NULL OR btrim(NEW.matricule) = '' THEN
    NEW.matricule := public.next_matricule();
  END IF;
  UPDATE public.matricules_emis SET adherent_id = NEW.id WHERE matricule = NEW.matricule;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_adherents_matricule ON public.adherents;
CREATE TRIGGER trg_adherents_matricule BEFORE INSERT ON public.adherents
  FOR EACH ROW EXECUTE FUNCTION public.set_adherent_matricule();

CREATE OR REPLACE FUNCTION public.protect_matricule()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.matricule IS DISTINCT FROM OLD.matricule THEN
    RAISE EXCEPTION 'Le numéro Humanitas ne peut pas être modifié.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_adherents_matricule_lock ON public.adherents;
CREATE TRIGGER trg_adherents_matricule_lock BEFORE UPDATE ON public.adherents
  FOR EACH ROW EXECUTE FUNCTION public.protect_matricule();

-- 5. Beneficiaires enrichis
ALTER TABLE public.beneficiaires
  ADD COLUMN IF NOT EXISTS statut public.statut_adherent NOT NULL DEFAULT 'en_attente',
  ADD COLUMN IF NOT EXISTS telephone text,
  ADD COLUMN IF NOT EXISTS piece_type text,
  ADD COLUMN IF NOT EXISTS piece_numero text,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE OR REPLACE FUNCTION public.enforce_beneficiaires_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE actifs int;
BEGIN
  IF NEW.is_active THEN
    SELECT count(*) INTO actifs FROM public.beneficiaires
      WHERE adherent_id = NEW.adherent_id AND is_active
        AND (TG_OP = 'INSERT' OR id <> NEW.id);
    IF actifs >= 4 THEN
      RAISE EXCEPTION 'Limite atteinte : un adhérent ne peut avoir que 4 bénéficiaires actifs.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_beneficiaires_limit ON public.beneficiaires;
CREATE TRIGGER trg_beneficiaires_limit BEFORE INSERT OR UPDATE ON public.beneficiaires
  FOR EACH ROW EXECUTE FUNCTION public.enforce_beneficiaires_limit();

-- 6. Transitions de statut controlees
CREATE OR REPLACE FUNCTION public.check_statut_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE allowed text[];
BEGIN
  IF NEW.statut = OLD.statut THEN RETURN NEW; END IF;
  allowed := CASE OLD.statut::text
    WHEN 'en_attente' THEN ARRAY['actif','inactif','resilie','decede']
    WHEN 'actif'      THEN ARRAY['suspendu','expire','resilie','inactif','decede']
    WHEN 'suspendu'   THEN ARRAY['actif','resilie','expire','inactif','decede']
    WHEN 'expire'     THEN ARRAY['actif','resilie','inactif','decede']
    WHEN 'inactif'    THEN ARRAY['actif','resilie','decede']
    WHEN 'resilie'    THEN ARRAY['actif','decede']
    WHEN 'decede'     THEN ARRAY[]::text[]
    ELSE ARRAY[]::text[] END;
  IF NOT (NEW.statut::text = ANY(allowed)) THEN
    RAISE EXCEPTION 'Transition de statut interdite : % vers %', OLD.statut, NEW.statut
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_adherents_statut ON public.adherents;
CREATE TRIGGER trg_adherents_statut BEFORE UPDATE OF statut ON public.adherents
  FOR EACH ROW EXECUTE FUNCTION public.check_statut_transition();

DROP TRIGGER IF EXISTS trg_beneficiaires_statut ON public.beneficiaires;
CREATE TRIGGER trg_beneficiaires_statut BEFORE UPDATE OF statut ON public.beneficiaires
  FOR EACH ROW EXECUTE FUNCTION public.check_statut_transition();

-- 7. Documents
CREATE TABLE IF NOT EXISTS public.adherent_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adherent_id uuid NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
  beneficiaire_id uuid REFERENCES public.beneficiaires(id) ON DELETE CASCADE,
  type public.type_document NOT NULL DEFAULT 'autre',
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adherent_documents TO authenticated;
GRANT ALL ON public.adherent_documents TO service_role;
ALTER TABLE public.adherent_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS adherent_documents_read ON public.adherent_documents;
CREATE POLICY adherent_documents_read ON public.adherent_documents FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS adherent_documents_manage ON public.adherent_documents;
CREATE POLICY adherent_documents_manage ON public.adherent_documents FOR ALL TO authenticated
  USING (public.can_manage_adherents(auth.uid()))
  WITH CHECK (public.can_manage_adherents(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_adherent_documents_adherent ON public.adherent_documents(adherent_id);
DROP TRIGGER IF EXISTS trg_adherent_documents_updated ON public.adherent_documents;
CREATE TRIGGER trg_adherent_documents_updated BEFORE UPDATE ON public.adherent_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Historique du dossier
CREATE TABLE IF NOT EXISTS public.adherent_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adherent_id uuid NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
  beneficiaire_id uuid REFERENCES public.beneficiaires(id) ON DELETE SET NULL,
  evenement text NOT NULL,
  ancien_statut text,
  nouveau_statut text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.adherent_historique TO authenticated;
GRANT ALL ON public.adherent_historique TO service_role;
ALTER TABLE public.adherent_historique ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS adherent_historique_read ON public.adherent_historique;
CREATE POLICY adherent_historique_read ON public.adherent_historique FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS adherent_historique_insert ON public.adherent_historique;
CREATE POLICY adherent_historique_insert ON public.adherent_historique FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_adherents(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_adherent_historique_adherent ON public.adherent_historique(adherent_id, created_at DESC);

-- 9. Audit automatique
CREATE OR REPLACE FUNCTION public.audit_adherents()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aid uuid; bid uuid; evt text;
BEGIN
  IF TG_TABLE_NAME = 'adherents' THEN
    aid := COALESCE(NEW.id, OLD.id); bid := NULL;
  ELSE
    aid := COALESCE(NEW.adherent_id, OLD.adherent_id); bid := COALESCE(NEW.id, OLD.id);
  END IF;

  evt := lower(TG_OP) || '_' || TG_TABLE_NAME;

  INSERT INTO public.audit_logs (user_id, action, entite, entite_id, details)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    )
  );

  INSERT INTO public.adherent_historique (adherent_id, beneficiaire_id, evenement, ancien_statut, nouveau_statut, details, created_by)
  VALUES (
    aid, bid, evt,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.statut::text END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.statut::text END,
    '{}'::jsonb, auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_audit_adherents ON public.adherents;
CREATE TRIGGER trg_audit_adherents AFTER INSERT OR UPDATE OR DELETE ON public.adherents
  FOR EACH ROW EXECUTE FUNCTION public.audit_adherents();

DROP TRIGGER IF EXISTS trg_audit_beneficiaires ON public.beneficiaires;
CREATE TRIGGER trg_audit_beneficiaires AFTER INSERT OR UPDATE OR DELETE ON public.beneficiaires
  FOR EACH ROW EXECUTE FUNCTION public.audit_adherents();

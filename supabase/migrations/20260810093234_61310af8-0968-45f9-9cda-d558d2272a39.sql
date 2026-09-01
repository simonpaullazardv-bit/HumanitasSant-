-- =====================================================================
-- HUMANITAS SANTÉ — Phase 1 : identité, rôles, adhésions, partenaires
-- =====================================================================

-- ---------- Types -----------------------------------------------------
CREATE TYPE public.app_role AS ENUM (
  'super_admin','administrateur','coordonnateur','medecin_conseil',
  'financier','agent_humanitas','entreprise','hopital','adherent'
);

CREATE TYPE public.tier_code AS ENUM ('bronze','argent','or','platine');
CREATE TYPE public.statut_adherent AS ENUM ('actif','suspendu','expire','en_attente','resilie');
CREATE TYPE public.statut_cotisation AS ENUM ('due','partielle','payee','en_retard','annulee');
CREATE TYPE public.mode_paiement AS ENUM ('especes','mobile_money','virement','carte','cheque');
CREATE TYPE public.type_partenaire AS ENUM ('hopital','pharmacie','laboratoire','centre_bien_etre','entreprise');
CREATE TYPE public.lien_parente AS ENUM ('conjoint','enfant','parent','autre');

-- ---------- Utilitaire updated_at ------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------- profiles --------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  fonction    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- user_roles ------------------------------------------------
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ---------- Fonctions d'autorisation ---------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

-- Personnel interne
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','administrateur','coordonnateur',
                   'medecin_conseil','financier','agent_humanitas')
  );
$$;

-- Administration (gestion des données de référence)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','administrateur')
  );
$$;

-- Gestion opérationnelle des dossiers adhérents
CREATE OR REPLACE FUNCTION public.can_manage_adherents(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','administrateur','coordonnateur')
  );
$$;

-- Gestion financière
CREATE OR REPLACE FUNCTION public.can_manage_finance(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','administrateur','financier')
  );
$$;

-- ---------- Policies profiles / user_roles ---------------------------
CREATE POLICY "profiles_select_self" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "user_roles_admin_write" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------- Création automatique du profil ---------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'adherent')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- categories_adhesion --------------------------------------
CREATE TABLE public.categories_adhesion (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          public.tier_code NOT NULL UNIQUE,
  nom           TEXT NOT NULL,
  prix_usd      NUMERIC(10,2) NOT NULL,
  periode       TEXT NOT NULL DEFAULT 'mois',
  tagline       TEXT,
  description   TEXT,
  plafond_usd   NUMERIC(12,2),
  taux_couverture SMALLINT NOT NULL DEFAULT 80,
  avantages     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ordre         SMALLINT NOT NULL DEFAULT 0,
  mise_en_avant BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories_adhesion TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories_adhesion TO authenticated;
GRANT ALL ON public.categories_adhesion TO service_role;
ALTER TABLE public.categories_adhesion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories_adhesion
  FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "categories_admin_write" ON public.categories_adhesion
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories_adhesion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- partenaires ----------------------------------------------
CREATE TABLE public.partenaires (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  type         public.type_partenaire NOT NULL,
  categorie    TEXT,
  description  TEXT,
  logo_url     TEXT,
  adresse      TEXT,
  commune      TEXT,
  ville        TEXT NOT NULL DEFAULT 'Kinshasa',
  telephone    TEXT,
  email        TEXT,
  site_web     TEXT,
  conventionne BOOLEAN NOT NULL DEFAULT true,
  date_convention DATE,
  ordre        SMALLINT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partenaires_type ON public.partenaires(type) WHERE is_active;
CREATE INDEX idx_partenaires_commune ON public.partenaires(commune);
GRANT SELECT ON public.partenaires TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partenaires TO authenticated;
GRANT ALL ON public.partenaires TO service_role;
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partenaires_public_read" ON public.partenaires
  FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "partenaires_admin_write" ON public.partenaires
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_partenaires_updated BEFORE UPDATE ON public.partenaires
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- adherents -------------------------------------------------
CREATE TABLE public.adherents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule      TEXT NOT NULL UNIQUE,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nom            TEXT NOT NULL,
  postnom        TEXT,
  prenom         TEXT,
  sexe           TEXT,
  date_naissance DATE,
  email          TEXT,
  telephone      TEXT,
  adresse        TEXT,
  commune        TEXT,
  ville          TEXT NOT NULL DEFAULT 'Kinshasa',
  photo_url      TEXT,
  categorie_id   UUID REFERENCES public.categories_adhesion(id) ON DELETE RESTRICT,
  entreprise_id  UUID REFERENCES public.partenaires(id) ON DELETE SET NULL,
  statut         public.statut_adherent NOT NULL DEFAULT 'en_attente',
  date_adhesion  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_adherents_user ON public.adherents(user_id);
CREATE INDEX idx_adherents_statut ON public.adherents(statut);
CREATE INDEX idx_adherents_categorie ON public.adherents(categorie_id);
CREATE INDEX idx_adherents_entreprise ON public.adherents(entreprise_id);
CREATE INDEX idx_adherents_nom ON public.adherents(lower(nom), lower(coalesce(prenom,'')));
CREATE INDEX idx_adherents_created ON public.adherents(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adherents TO authenticated;
GRANT ALL ON public.adherents TO service_role;
ALTER TABLE public.adherents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adherents_read" ON public.adherents
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "adherents_manage" ON public.adherents
  FOR ALL TO authenticated
  USING (public.can_manage_adherents(auth.uid()))
  WITH CHECK (public.can_manage_adherents(auth.uid()));
CREATE TRIGGER trg_adherents_updated BEFORE UPDATE ON public.adherents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Propriété du dossier (utilisée par les tables liées)
CREATE OR REPLACE FUNCTION public.owns_adherent(_user_id UUID, _adherent_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.adherents WHERE id = _adherent_id AND user_id = _user_id);
$$;

-- ---------- beneficiaires --------------------------------------------
CREATE TABLE public.beneficiaires (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adherent_id    UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  prenom         TEXT,
  lien           public.lien_parente NOT NULL DEFAULT 'autre',
  date_naissance DATE,
  sexe           TEXT,
  photo_url      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_beneficiaires_adherent ON public.beneficiaires(adherent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaires TO authenticated;
GRANT ALL ON public.beneficiaires TO service_role;
ALTER TABLE public.beneficiaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beneficiaires_read" ON public.beneficiaires
  FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));
CREATE POLICY "beneficiaires_manage" ON public.beneficiaires
  FOR ALL TO authenticated
  USING (public.can_manage_adherents(auth.uid()))
  WITH CHECK (public.can_manage_adherents(auth.uid()));
CREATE TRIGGER trg_beneficiaires_updated BEFORE UPDATE ON public.beneficiaires
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- adhesions (périodes de couverture) ------------------------
CREATE TABLE public.adhesions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adherent_id  UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
  categorie_id UUID NOT NULL REFERENCES public.categories_adhesion(id) ON DELETE RESTRICT,
  date_debut   DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin     DATE,
  statut       public.statut_adherent NOT NULL DEFAULT 'actif',
  montant_usd  NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_adhesions_adherent ON public.adhesions(adherent_id);
CREATE INDEX idx_adhesions_periode ON public.adhesions(date_debut DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adhesions TO authenticated;
GRANT ALL ON public.adhesions TO service_role;
ALTER TABLE public.adhesions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adhesions_read" ON public.adhesions
  FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));
CREATE POLICY "adhesions_manage" ON public.adhesions
  FOR ALL TO authenticated
  USING (public.can_manage_adherents(auth.uid()))
  WITH CHECK (public.can_manage_adherents(auth.uid()));
CREATE TRIGGER trg_adhesions_updated BEFORE UPDATE ON public.adhesions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- cotisations ------------------------------------------------
CREATE TABLE public.cotisations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adherent_id  UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
  adhesion_id  UUID REFERENCES public.adhesions(id) ON DELETE SET NULL,
  periode      DATE NOT NULL,
  montant_usd  NUMERIC(10,2) NOT NULL,
  montant_paye NUMERIC(10,2) NOT NULL DEFAULT 0,
  echeance     DATE NOT NULL,
  statut       public.statut_cotisation NOT NULL DEFAULT 'due',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (adherent_id, periode)
);
CREATE INDEX idx_cotisations_adherent ON public.cotisations(adherent_id);
CREATE INDEX idx_cotisations_statut ON public.cotisations(statut, echeance);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotisations TO authenticated;
GRANT ALL ON public.cotisations TO service_role;
ALTER TABLE public.cotisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cotisations_read" ON public.cotisations
  FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));
CREATE POLICY "cotisations_manage" ON public.cotisations
  FOR ALL TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));
CREATE TRIGGER trg_cotisations_updated BEFORE UPDATE ON public.cotisations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- paiements --------------------------------------------------
CREATE TABLE public.paiements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotisation_id UUID NOT NULL REFERENCES public.cotisations(id) ON DELETE CASCADE,
  adherent_id   UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
  montant_usd   NUMERIC(10,2) NOT NULL,
  mode          public.mode_paiement NOT NULL DEFAULT 'especes',
  reference     TEXT,
  date_paiement TIMESTAMPTZ NOT NULL DEFAULT now(),
  encaisse_par  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_paiements_adherent ON public.paiements(adherent_id);
CREATE INDEX idx_paiements_date ON public.paiements(date_paiement DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paiements TO authenticated;
GRANT ALL ON public.paiements TO service_role;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paiements_read" ON public.paiements
  FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));
CREATE POLICY "paiements_manage" ON public.paiements
  FOR ALL TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));

-- ---------- cartes_membre ---------------------------------------------
CREATE TABLE public.cartes_membre (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adherent_id UUID NOT NULL UNIQUE REFERENCES public.adherents(id) ON DELETE CASCADE,
  numero      TEXT NOT NULL UNIQUE,
  qr_token    UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_expiration DATE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cartes_membre TO authenticated;
GRANT ALL ON public.cartes_membre TO service_role;
ALTER TABLE public.cartes_membre ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cartes_read" ON public.cartes_membre
  FOR SELECT TO authenticated
  USING (public.owns_adherent(auth.uid(), adherent_id) OR public.is_staff(auth.uid()));
CREATE POLICY "cartes_manage" ON public.cartes_membre
  FOR ALL TO authenticated
  USING (public.can_manage_adherents(auth.uid()))
  WITH CHECK (public.can_manage_adherents(auth.uid()));
CREATE TRIGGER trg_cartes_updated BEFORE UPDATE ON public.cartes_membre
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- audit_logs --------------------------------------------------
CREATE TABLE public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entite     TEXT NOT NULL,
  entite_id  UUID,
  details    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_entite ON public.audit_logs(entite, entite_id);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read_admin" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- DONNÉES DE DÉMONSTRATION
-- =====================================================================
INSERT INTO public.categories_adhesion
  (code, nom, prix_usd, periode, tagline, plafond_usd, taux_couverture, avantages, ordre, mise_en_avant) VALUES
('bronze','Bronze',25,'mois','L''essentiel pour se soigner sereinement',1000,70,
  '["Consultations générales","Médicaments essentiels","Examens de laboratoire de base","Assistance téléphonique"]'::jsonb,1,false),
('argent','Argent',50,'mois','Une couverture élargie pour la famille',2500,80,
  '["Tous les avantages Bronze","Consultations spécialisées","Imagerie médicale","Hospitalisation courte durée","2 bénéficiaires inclus"]'::jsonb,2,false),
('or','Or',75,'mois','Protection renforcée et prise en charge rapide',5000,90,
  '["Tous les avantages Argent","Hospitalisation complète","Maternité","Soins dentaires et optiques","4 bénéficiaires inclus"]'::jsonb,3,true),
('platine','Platine',100,'mois','La couverture la plus complète de Humanitas',10000,100,
  '["Tous les avantages Or","Chirurgie et interventions lourdes","Évacuation sanitaire","Bilan de santé annuel","Accès prioritaire Centre de Bien-être","6 bénéficiaires inclus"]'::jsonb,4,false);

INSERT INTO public.partenaires (nom, slug, type, categorie, description, adresse, commune, telephone, email, ordre) VALUES
('Cliniques Universitaires de Kinshasa','cliniques-universitaires-kinshasa','hopital','Hôpital universitaire','Établissement de référence pour les soins spécialisés et la chirurgie.','Avenue de l''Université','Lemba','+243 810 000 101','contact@cuk.cd',1),
('Hôpital Général de Référence de Kinshasa','hgr-kinshasa','hopital','Hôpital général','Prise en charge complète, urgences 24h/24 et maternité.','Avenue Tombalbaye','Gombe','+243 810 000 102','info@hgrk.cd',2),
('Centre Hospitalier Monkole','centre-hospitalier-monkole','hopital','Centre hospitalier','Soins de qualité, pédiatrie et médecine interne.','Avenue Ngafani','Mont-Ngafula','+243 810 000 103','accueil@monkole.cd',3),
('Clinique Ngaliema','clinique-ngaliema','hopital','Clinique','Plateau technique moderne et consultations spécialisées.','Avenue des Cliniques','Gombe','+243 810 000 104','contact@ngaliema.cd',4),
('Pharmacie Kin-Santé','pharmacie-kin-sante','pharmacie','Pharmacie conventionnée','Délivrance de médicaments sans avance de frais pour les adhérents.','Boulevard du 30 Juin','Gombe','+243 810 000 201','kinsante@pharma.cd',5),
('Pharmacie Bahumbu','pharmacie-bahumbu','pharmacie','Pharmacie de proximité','Médicaments essentiels et conseils pharmaceutiques.','Avenue Mavinga','N''Sele','+243 810 000 202','bahumbu@pharma.cd',6),
('Laboratoire BioKin','laboratoire-biokin','laboratoire','Analyses médicales','Analyses biologiques et bilans complets à tarifs négociés.','Avenue Kasa-Vubu','Kasa-Vubu','+243 810 000 301','labo@biokin.cd',7),
('Laboratoire Centre Diagnostic','laboratoire-centre-diagnostic','laboratoire','Imagerie et biologie','Imagerie médicale, échographie et analyses spécialisées.','Avenue Kabambare','Barumbu','+243 810 000 302','contact@cdiag.cd',8),
('Centre de Bien-être Humanitas Plazza','centre-bien-etre-humanitas-plazza','centre_bien_etre','Bien-être et prévention','Kinésithérapie, nutrition, remise en forme et accompagnement préventif.','12 PLAZZA, avenue Mavinga, Quartier Bahumbu','N''Sele','+243 844 433 025','bienetre@humanitas.cd',9),
('Espace Zen Gombe','espace-zen-gombe','centre_bien_etre','Bien-être','Massages thérapeutiques et programmes anti-stress.','Avenue Colonel Ebeya','Gombe','+243 810 000 401','contact@espacezen.cd',10),
('Congo Business Group','congo-business-group','entreprise','Entreprise partenaire','Couverture santé collective pour ses collaborateurs.','Boulevard du 30 Juin','Gombe','+243 810 000 501','rh@cbg.cd',11),
('Kin Logistics SARL','kin-logistics-sarl','entreprise','Entreprise partenaire','Adhésion groupée pour le personnel et leurs familles.','Avenue Poids Lourds','Limete','+243 810 000 502','rh@kinlogistics.cd',12);

-- Adhérents de démonstration
INSERT INTO public.adherents (matricule, nom, postnom, prenom, sexe, date_naissance, email, telephone, commune, categorie_id, entreprise_id, statut, date_adhesion)
SELECT d.matricule, d.nom, d.postnom, d.prenom, d.sexe, d.dn::date, d.email, d.tel, d.commune,
       c.id,
       (SELECT p.id FROM public.partenaires p WHERE p.slug = d.entreprise_slug),
       d.statut::public.statut_adherent,
       d.adhesion::date
FROM (VALUES
  ('HUM-2025-0001','Mulyama','Kabeya','Gerlas','M','1978-03-12','gerlas.mulyama@humanitas.cd','+243 844 433 025','N''Sele','platine',NULL,'actif','2024-01-15'),
  ('HUM-2025-0002','Kabuyaya','Muhindo','Serge','M','1985-07-04','serge.kabuyaya@humanitas.cd','+243 810 111 002','Lemba','or',NULL,'actif','2024-02-10'),
  ('HUM-2025-0003','Nsimba','Lelo','Christine','F','1990-11-22','christine.nsimba@example.cd','+243 810 111 003','Gombe','argent','congo-business-group','actif','2024-03-05'),
  ('HUM-2025-0004','Ilunga','Kalala','Patrick','M','1982-05-30','patrick.ilunga@example.cd','+243 810 111 004','Limete','bronze','kin-logistics-sarl','actif','2024-04-18'),
  ('HUM-2025-0005','Mbuyi','Tshibangu','Grace','F','1995-09-09','grace.mbuyi@example.cd','+243 810 111 005','Ngaliema','or',NULL,'actif','2024-05-21'),
  ('HUM-2025-0006','Lokombe','Bofenda','Jean','M','1975-01-17','jean.lokombe@example.cd','+243 810 111 006','Barumbu','argent',NULL,'suspendu','2024-06-02'),
  ('HUM-2025-0007','Kasongo','Mwamba','Alice','F','1988-12-01','alice.kasongo@example.cd','+243 810 111 007','Kasa-Vubu','bronze','congo-business-group','actif','2024-07-14'),
  ('HUM-2025-0008','Bemba','Ngoy','Dieudonné','M','1970-08-25','dieudonne.bemba@example.cd','+243 810 111 008','Mont-Ngafula','platine',NULL,'actif','2024-08-30'),
  ('HUM-2025-0009','Tshiala','Mande','Sylvie','F','1993-04-11','sylvie.tshiala@example.cd','+243 810 111 009','Ndjili','argent','kin-logistics-sarl','en_attente','2025-01-09'),
  ('HUM-2025-0010','Mukendi','Beya','Olivier','M','1986-10-19','olivier.mukendi@example.cd','+243 810 111 010','Matete','or',NULL,'actif','2025-02-16'),
  ('HUM-2025-0011','Ngalula','Kanku','Bernadette','F','1968-06-06','bernadette.ngalula@example.cd','+243 810 111 011','Selembao','bronze',NULL,'expire','2023-11-03'),
  ('HUM-2025-0012','Mbala','Nzuzi','Fiston','M','1998-02-27','fiston.mbala@example.cd','+243 810 111 012','N''Sele','platine',NULL,'actif','2025-03-22')
) AS d(matricule,nom,postnom,prenom,sexe,dn,email,tel,commune,cat,entreprise_slug,statut,adhesion)
JOIN public.categories_adhesion c ON c.code = d.cat::public.tier_code;

-- Bénéficiaires
INSERT INTO public.beneficiaires (adherent_id, nom, prenom, lien, date_naissance, sexe)
SELECT a.id, b.nom, b.prenom, b.lien::public.lien_parente, b.dn::date, b.sexe
FROM (VALUES
  ('HUM-2025-0001','Mulyama','Sarah','conjoint','1982-04-02','F'),
  ('HUM-2025-0001','Mulyama','Emmanuel','enfant','2010-09-14','M'),
  ('HUM-2025-0002','Kabuyaya','Miriam','conjoint','1989-01-25','F'),
  ('HUM-2025-0003','Nsimba','Joel','enfant','2015-06-30','M'),
  ('HUM-2025-0005','Mbuyi','Esther','enfant','2018-03-08','F'),
  ('HUM-2025-0008','Bemba','Julienne','conjoint','1974-05-19','F'),
  ('HUM-2025-0008','Bemba','Nathan','enfant','2006-12-11','M'),
  ('HUM-2025-0010','Mukendi','Divine','conjoint','1990-07-07','F')
) AS b(matricule,nom,prenom,lien,dn,sexe)
JOIN public.adherents a ON a.matricule = b.matricule;

-- Adhésions actives
INSERT INTO public.adhesions (adherent_id, categorie_id, date_debut, date_fin, statut, montant_usd)
SELECT a.id, a.categorie_id, a.date_adhesion, a.date_adhesion + INTERVAL '1 year', a.statut, c.prix_usd
FROM public.adherents a
JOIN public.categories_adhesion c ON c.id = a.categorie_id;

-- Cotisations des 6 derniers mois
INSERT INTO public.cotisations (adherent_id, adhesion_id, periode, montant_usd, montant_paye, echeance, statut)
SELECT a.id,
       (SELECT ad.id FROM public.adhesions ad WHERE ad.adherent_id = a.id LIMIT 1),
       p.periode,
       c.prix_usd,
       CASE WHEN a.statut = 'actif' AND p.offset_mois > 0 THEN c.prix_usd
            WHEN a.statut = 'actif' THEN c.prix_usd / 2
            ELSE 0 END,
       (p.periode + INTERVAL '10 days')::date,
       CASE WHEN a.statut = 'actif' AND p.offset_mois > 0 THEN 'payee'::public.statut_cotisation
            WHEN a.statut = 'actif' THEN 'partielle'::public.statut_cotisation
            WHEN a.statut = 'suspendu' THEN 'en_retard'::public.statut_cotisation
            ELSE 'due'::public.statut_cotisation END
FROM public.adherents a
JOIN public.categories_adhesion c ON c.id = a.categorie_id
CROSS JOIN LATERAL (
  SELECT gs AS offset_mois,
         (date_trunc('month', CURRENT_DATE) - (gs || ' months')::interval)::date AS periode
  FROM generate_series(0,5) AS gs
) p
WHERE a.date_adhesion <= p.periode;

-- Paiements correspondants
INSERT INTO public.paiements (cotisation_id, adherent_id, montant_usd, mode, reference, date_paiement)
SELECT co.id, co.adherent_id, co.montant_paye,
       (ARRAY['especes','mobile_money','virement','carte']::public.mode_paiement[])[1 + (abs(hashtext(co.id::text)) % 4)],
       'PAY-' || upper(substr(replace(co.id::text,'-',''),1,10)),
       (co.periode + INTERVAL '5 days')
FROM public.cotisations co
WHERE co.montant_paye > 0;

-- Cartes membres
INSERT INTO public.cartes_membre (adherent_id, numero, date_emission, date_expiration, is_active)
SELECT a.id,
       'CM-' || substr(a.matricule, 5),
       a.date_adhesion,
       (a.date_adhesion + INTERVAL '1 year')::date,
       a.statut = 'actif'
FROM public.adherents a;
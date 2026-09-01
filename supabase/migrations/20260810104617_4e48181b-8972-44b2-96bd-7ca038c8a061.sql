-- =====================================================================
-- HUMANITAS SANTÉ — Socle CMS, médiathèque et paramètres
-- Extension du modèle existant. Aucune table existante n'est modifiée.
-- =====================================================================

CREATE TYPE public.cms_statut AS ENUM ('brouillon', 'publie', 'archive');
CREATE TYPE public.media_type AS ENUM ('image', 'video', 'document', 'audre');
CREATE TYPE public.reseau_social AS ENUM ('facebook','instagram','tiktok','youtube','linkedin','x','whatsapp','telegram');

-- ---------------------------------------------------------------------
-- Fonction d'autorisation CMS (SECURITY DEFINER, pas de récursion RLS)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_cms(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','administrateur','coordonnateur')
  );
$$;

-- ---------------------------------------------------------------------
-- 1. Pages éditoriales
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  titre text NOT NULL,
  sous_titre text,
  contenu text,
  image_url text,
  seo_title text,
  seo_description text,
  og_image_url text,
  ordre smallint NOT NULL DEFAULT 0,
  statut public.cms_statut NOT NULL DEFAULT 'brouillon',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT ALL ON public.cms_pages TO service_role;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_pages_public_read ON public.cms_pages FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active);
CREATE POLICY cms_pages_manage ON public.cms_pages FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 2. Sections de page
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  cle text NOT NULL,
  titre text,
  sous_titre text,
  contenu text,
  image_url text,
  video_url text,
  donnees jsonb NOT NULL DEFAULT '{}'::jsonb,
  ordre smallint NOT NULL DEFAULT 0,
  statut public.cms_statut NOT NULL DEFAULT 'publie',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, cle)
);
GRANT SELECT ON public.cms_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_sections TO authenticated;
GRANT ALL ON public.cms_sections TO service_role;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_sections_public_read ON public.cms_sections FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active);
CREATE POLICY cms_sections_manage ON public.cms_sections FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 3. Bannières
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_bannieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  sous_titre text,
  image_url text,
  bouton_libelle text,
  bouton_lien text,
  ordre smallint NOT NULL DEFAULT 0,
  date_debut timestamptz,
  date_fin timestamptz,
  statut public.cms_statut NOT NULL DEFAULT 'brouillon',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_bannieres TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_bannieres TO authenticated;
GRANT ALL ON public.cms_bannieres TO service_role;
ALTER TABLE public.cms_bannieres ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_bannieres_public_read ON public.cms_bannieres FOR SELECT TO anon, authenticated
  USING (
    statut = 'publie' AND is_active
    AND (date_debut IS NULL OR date_debut <= now())
    AND (date_fin IS NULL OR date_fin >= now())
  );
CREATE POLICY cms_bannieres_manage ON public.cms_bannieres FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- Cohérence des dates (règle temporelle -> trigger, pas de CHECK)
CREATE OR REPLACE FUNCTION public.check_banniere_dates()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.date_debut IS NOT NULL AND NEW.date_fin IS NOT NULL AND NEW.date_fin < NEW.date_debut THEN
    RAISE EXCEPTION 'La date de fin doit être postérieure à la date de début.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_bannieres_dates BEFORE INSERT OR UPDATE ON public.cms_bannieres
  FOR EACH ROW EXECUTE FUNCTION public.check_banniere_dates();

-- ---------------------------------------------------------------------
-- 4. Actualités / blog
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_actualites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  titre text NOT NULL,
  extrait text,
  contenu text,
  image_url text,
  categorie text,
  auteur text,
  date_publication timestamptz NOT NULL DEFAULT now(),
  statut public.cms_statut NOT NULL DEFAULT 'brouillon',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_actualites_publication ON public.cms_actualites (date_publication DESC) WHERE statut = 'publie';
GRANT SELECT ON public.cms_actualites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_actualites TO authenticated;
GRANT ALL ON public.cms_actualites TO service_role;
ALTER TABLE public.cms_actualites ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_actualites_public_read ON public.cms_actualites FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active AND date_publication <= now());
CREATE POLICY cms_actualites_owner_read ON public.cms_actualites FOR SELECT TO authenticated
  USING (public.can_manage_cms(auth.uid()));
CREATE POLICY cms_actualites_manage ON public.cms_actualites FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 5. Événements
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_evenements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  titre text NOT NULL,
  description text,
  contenu text,
  lieu text,
  image_url text,
  date_debut timestamptz NOT NULL,
  date_fin timestamptz,
  statut public.cms_statut NOT NULL DEFAULT 'brouillon',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_evenements_date ON public.cms_evenements (date_debut DESC) WHERE statut = 'publie';
GRANT SELECT ON public.cms_evenements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_evenements TO authenticated;
GRANT ALL ON public.cms_evenements TO service_role;
ALTER TABLE public.cms_evenements ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_evenements_public_read ON public.cms_evenements FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active);
CREATE POLICY cms_evenements_manage ON public.cms_evenements FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 6. FAQ
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  reponse text NOT NULL,
  categorie text,
  ordre smallint NOT NULL DEFAULT 0,
  statut public.cms_statut NOT NULL DEFAULT 'publie',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_faq TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_faq TO authenticated;
GRANT ALL ON public.cms_faq TO service_role;
ALTER TABLE public.cms_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_faq_public_read ON public.cms_faq FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active);
CREATE POLICY cms_faq_manage ON public.cms_faq FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 7. Témoignages
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_temoignages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur text NOT NULL,
  fonction text,
  message text NOT NULL,
  photo_url text,
  note smallint CHECK (note BETWEEN 1 AND 5),
  ordre smallint NOT NULL DEFAULT 0,
  statut public.cms_statut NOT NULL DEFAULT 'brouillon',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_temoignages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_temoignages TO authenticated;
GRANT ALL ON public.cms_temoignages TO service_role;
ALTER TABLE public.cms_temoignages ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_temoignages_public_read ON public.cms_temoignages FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active);
CREATE POLICY cms_temoignages_manage ON public.cms_temoignages FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 8. Services
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  titre text NOT NULL,
  description text,
  contenu text,
  icone text,
  image_url text,
  ordre smallint NOT NULL DEFAULT 0,
  statut public.cms_statut NOT NULL DEFAULT 'publie',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_services TO authenticated;
GRANT ALL ON public.cms_services TO service_role;
ALTER TABLE public.cms_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_services_public_read ON public.cms_services FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active);
CREATE POLICY cms_services_manage ON public.cms_services FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 9. Équipe
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  fonction text,
  bio text,
  photo_url text,
  email text,
  linkedin_url text,
  ordre smallint NOT NULL DEFAULT 0,
  statut public.cms_statut NOT NULL DEFAULT 'publie',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_equipe TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_equipe TO authenticated;
GRANT ALL ON public.cms_equipe TO service_role;
ALTER TABLE public.cms_equipe ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_equipe_public_read ON public.cms_equipe FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active);
CREATE POLICY cms_equipe_manage ON public.cms_equipe FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 10. Téléchargements
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_telechargements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  fichier_url text NOT NULL,
  categorie text,
  taille_octets bigint,
  ordre smallint NOT NULL DEFAULT 0,
  statut public.cms_statut NOT NULL DEFAULT 'publie',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_telechargements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_telechargements TO authenticated;
GRANT ALL ON public.cms_telechargements TO service_role;
ALTER TABLE public.cms_telechargements ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_telechargements_public_read ON public.cms_telechargements FOR SELECT TO anon, authenticated
  USING (statut = 'publie' AND is_active);
CREATE POLICY cms_telechargements_manage ON public.cms_telechargements FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 11. Réseaux sociaux
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_reseaux_sociaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plateforme public.reseau_social NOT NULL UNIQUE,
  url text NOT NULL,
  libelle text,
  ordre smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_reseaux_sociaux TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_reseaux_sociaux TO authenticated;
GRANT ALL ON public.cms_reseaux_sociaux TO service_role;
ALTER TABLE public.cms_reseaux_sociaux ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_reseaux_public_read ON public.cms_reseaux_sociaux FOR SELECT TO anon, authenticated
  USING (is_active);
CREATE POLICY cms_reseaux_manage ON public.cms_reseaux_sociaux FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 12. Médiathèque
-- ---------------------------------------------------------------------
CREATE TABLE public.cms_medias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  bucket text NOT NULL DEFAULT 'medias',
  storage_path text NOT NULL,
  url_publique text,
  type public.media_type NOT NULL DEFAULT 'image',
  mime_type text,
  taille_octets bigint,
  largeur integer,
  hauteur integer,
  categorie text,
  texte_alternatif text,
  legende text,
  metadonnees jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_protege boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, storage_path)
);
CREATE INDEX idx_medias_categorie ON public.cms_medias (categorie) WHERE is_active;
GRANT SELECT ON public.cms_medias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_medias TO authenticated;
GRANT ALL ON public.cms_medias TO service_role;
ALTER TABLE public.cms_medias ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_medias_public_read ON public.cms_medias FOR SELECT TO anon, authenticated
  USING (is_active);
CREATE POLICY cms_medias_manage ON public.cms_medias FOR ALL TO authenticated
  USING (public.can_manage_cms(auth.uid())) WITH CHECK (public.can_manage_cms(auth.uid()));

-- ---------------------------------------------------------------------
-- 13. Paramètres applicatifs (prix carte, plafonds, délais, sécurité…)
-- ---------------------------------------------------------------------
CREATE TABLE public.app_parametres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cle text NOT NULL UNIQUE,
  valeur jsonb NOT NULL,
  categorie text NOT NULL DEFAULT 'general',
  libelle text,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_parametres TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_parametres TO authenticated;
GRANT ALL ON public.app_parametres TO service_role;
ALTER TABLE public.app_parametres ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_parametres_public_read ON public.app_parametres FOR SELECT TO anon, authenticated
  USING (is_public);
CREATE POLICY app_parametres_staff_read ON public.app_parametres FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY app_parametres_admin_write ON public.app_parametres FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_cms_pages_updated BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_sections_updated BEFORE UPDATE ON public.cms_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_bannieres_updated BEFORE UPDATE ON public.cms_bannieres FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_actualites_updated BEFORE UPDATE ON public.cms_actualites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_evenements_updated BEFORE UPDATE ON public.cms_evenements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_faq_updated BEFORE UPDATE ON public.cms_faq FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_temoignages_updated BEFORE UPDATE ON public.cms_temoignages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_services_updated BEFORE UPDATE ON public.cms_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_equipe_updated BEFORE UPDATE ON public.cms_equipe FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_telechargements_updated BEFORE UPDATE ON public.cms_telechargements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_reseaux_updated BEFORE UPDATE ON public.cms_reseaux_sociaux FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cms_medias_updated BEFORE UPDATE ON public.cms_medias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_app_parametres_updated BEFORE UPDATE ON public.app_parametres FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- Paramètres initiaux
-- ---------------------------------------------------------------------
INSERT INTO public.app_parametres (cle, valeur, categorie, libelle, is_public) VALUES
  ('site.nom', '"Humanitas Santé"'::jsonb, 'site', 'Nom du site', true),
  ('site.slogan', '"Votre santé, notre priorité"'::jsonb, 'site', 'Slogan principal', true),
  ('site.email', '"contact@humanitassante.cd"'::jsonb, 'site', 'Email de contact', true),
  ('site.telephone', '"+243 844 433 025"'::jsonb, 'site', 'Téléphone de contact', true),
  ('site.adresse', '"12 PLAZZA, av. Mavinga, N''Sele, Kinshasa"'::jsonb, 'site', 'Adresse du siège', true),
  ('carte.prix_usd', '5'::jsonb, 'finance', 'Prix de la carte de membre (USD)', true),
  ('carte.validite_mois', '12'::jsonb, 'finance', 'Durée de validité de la carte (mois)', true),
  ('cotisation.mensualites_avant_droits', '3'::jsonb, 'mutuelle', 'Mensualités requises avant ouverture des droits', true),
  ('adherent.max_beneficiaires', '4'::jsonb, 'mutuelle', 'Nombre maximal de bénéficiaires', true),
  ('securite.max_tentatives_connexion', '5'::jsonb, 'securite', 'Tentatives de connexion avant alerte', false),
  ('securite.fenetre_tentatives_minutes', '15'::jsonb, 'securite', 'Fenêtre de comptage des tentatives (minutes)', false)
ON CONFLICT (cle) DO NOTHING;

-- Réseaux sociaux initiaux (désactivés tant que les liens réels ne sont pas fournis)
INSERT INTO public.cms_reseaux_sociaux (plateforme, url, ordre, is_active) VALUES
  ('facebook', 'https://facebook.com/humanitassante', 1, true),
  ('whatsapp', 'https://wa.me/243844433025', 2, true),
  ('instagram', 'https://instagram.com/humanitassante', 3, false),
  ('tiktok', 'https://tiktok.com/@humanitassante', 4, false),
  ('youtube', 'https://youtube.com/@humanitassante', 5, false),
  ('linkedin', 'https://linkedin.com/company/humanitassante', 6, false),
  ('x', 'https://x.com/humanitassante', 7, false),
  ('telegram', 'https://t.me/humanitassante', 8, false)
ON CONFLICT (plateforme) DO NOTHING;
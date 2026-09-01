-- =====================================================================
-- HUMANITAS SANTÉ — Harmonisation frontend / Supabase
-- Date : 2026-08-12
--
-- Objectifs :
--   1. Créer les tables utilisées par le site public mais absentes des
--      migrations précédentes.
--   2. Corriger la sécurité des modules RH / sécurité / GED.
--   3. Persister les préférences de notification utilisateur.
--
-- Cette migration NE remplace PAS l'historique existant. Elle est
-- volontairement additive et doit être exécutée APRÈS les migrations
-- 20260810093234 → 20260811110000.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLES DU SITE PUBLIC
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  handled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.callback_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  telephone text NOT NULL,
  sujet text NOT NULL,
  heure_souhaitee text NOT NULL,
  commentaire text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_intervenant text NOT NULL
    CHECK (type_intervenant IN ('Humanitas', 'Conseiller', 'Médecin conseil', 'Partenaire')),
  nom text NOT NULL,
  telephone text NOT NULL,
  email text NOT NULL,
  date date NOT NULL,
  creneau_horaire text NOT NULL,
  motif text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL CHECK (sender IN ('user', 'agent', 'bot')),
  sender_name text,
  content text NOT NULL,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.membership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  tier public.tier_code NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  category_label text NOT NULL,
  title text NOT NULL,
  description text,
  date_label text,
  location text,
  photo_url text,
  storage_path text,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. PRÉFÉRENCES UTILISATEUR
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT true,
  app_enabled boolean NOT NULL DEFAULT true,
  rappel_echeance_5 boolean NOT NULL DEFAULT true,
  alertes_securite boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. INDEX
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_callback_requests_created_at
  ON public.callback_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_date
  ON public.appointments (date, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_timestamp
  ON public.chat_messages (user_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_membership_requests_created_at
  ON public.membership_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_images_published_created
  ON public.gallery_images (is_published, created_at DESC);

-- ---------------------------------------------------------------------
-- 4. UPDATED_AT
-- ---------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_contact_messages_updated ON public.contact_messages;
CREATE TRIGGER trg_contact_messages_updated
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_callback_requests_updated ON public.callback_requests;
CREATE TRIGGER trg_callback_requests_updated
  BEFORE UPDATE ON public.callback_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_appointments_updated ON public.appointments;
CREATE TRIGGER trg_appointments_updated
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_gallery_images_updated ON public.gallery_images;
CREATE TRIGGER trg_gallery_images_updated
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_site_settings_updated ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_notification_preferences_updated ON public.user_notification_preferences;
CREATE TRIGGER trg_user_notification_preferences_updated
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. RLS — SITE PUBLIC
-- ---------------------------------------------------------------------

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Formulaires publics : insertion uniquement côté public.
DROP POLICY IF EXISTS contact_messages_public_insert ON public.contact_messages;
CREATE POLICY contact_messages_public_insert
  ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS contact_messages_staff_read ON public.contact_messages;
CREATE POLICY contact_messages_staff_read
  ON public.contact_messages FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS contact_messages_staff_update ON public.contact_messages;
CREATE POLICY contact_messages_staff_update
  ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS callback_requests_public_insert ON public.callback_requests;
CREATE POLICY callback_requests_public_insert
  ON public.callback_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS callback_requests_staff_read ON public.callback_requests;
CREATE POLICY callback_requests_staff_read
  ON public.callback_requests FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS callback_requests_staff_update ON public.callback_requests;
CREATE POLICY callback_requests_staff_update
  ON public.callback_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS appointments_public_insert ON public.appointments;
CREATE POLICY appointments_public_insert
  ON public.appointments FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS appointments_staff_read ON public.appointments;
CREATE POLICY appointments_staff_read
  ON public.appointments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS appointments_staff_update ON public.appointments;
CREATE POLICY appointments_staff_update
  ON public.appointments FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS chat_messages_public_insert ON public.chat_messages;
CREATE POLICY chat_messages_public_insert
  ON public.chat_messages FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS chat_messages_read_own_or_staff ON public.chat_messages;
CREATE POLICY chat_messages_read_own_or_staff
  ON public.chat_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS membership_requests_public_insert ON public.membership_requests;
CREATE POLICY membership_requests_public_insert
  ON public.membership_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS membership_requests_staff_read ON public.membership_requests;
CREATE POLICY membership_requests_staff_read
  ON public.membership_requests FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS membership_requests_staff_update ON public.membership_requests;
CREATE POLICY membership_requests_staff_update
  ON public.membership_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Galerie publique : lecture des images publiées, écriture administration.
DROP POLICY IF EXISTS gallery_images_public_read ON public.gallery_images;
CREATE POLICY gallery_images_public_read
  ON public.gallery_images FOR SELECT TO anon, authenticated
  USING (is_published OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS gallery_images_admin_write ON public.gallery_images;
CREATE POLICY gallery_images_admin_write
  ON public.gallery_images FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Paramètres publics : lecture seulement si explicitement marqués publics.
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (is_public OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
CREATE POLICY site_settings_admin_write
  ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Préférences personnelles.
DROP POLICY IF EXISTS notification_preferences_self_read ON public.user_notification_preferences;
CREATE POLICY notification_preferences_self_read
  ON public.user_notification_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS notification_preferences_self_insert ON public.user_notification_preferences;
CREATE POLICY notification_preferences_self_insert
  ON public.user_notification_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS notification_preferences_self_update ON public.user_notification_preferences;
CREATE POLICY notification_preferences_self_update
  ON public.user_notification_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 6. RLS — CORRECTION DES MODULES AJOUTÉS LE 11/08
-- ---------------------------------------------------------------------

ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presences_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conges_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses_administratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets_annuels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ged_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_historique ENABLE ROW LEVEL SECURITY;

-- Supprime les politiques trop permissives créées par la migration précédente.
DROP POLICY IF EXISTS lecture_authenticated_rh ON public.departements;
DROP POLICY IF EXISTS lecture_authenticated_presences ON public.presences_personnel;
DROP POLICY IF EXISTS ecriture_staff_presences ON public.presences_personnel;
DROP POLICY IF EXISTS lecture_conges ON public.conges_personnel;
DROP POLICY IF EXISTS ecriture_conges ON public.conges_personnel;
DROP POLICY IF EXISTS lecture_depenses ON public.depenses_administratives;
DROP POLICY IF EXISTS ecriture_depenses ON public.depenses_administratives;
DROP POLICY IF EXISTS ged_documents_read ON public.ged_documents;
DROP POLICY IF EXISTS ged_documents_write ON public.ged_documents;
DROP POLICY IF EXISTS param_hist_read ON public.parametres_historique;

DROP POLICY IF EXISTS departements_staff_read ON public.departements;
CREATE POLICY departements_staff_read
  ON public.departements FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS departements_admin_write ON public.departements;
CREATE POLICY departements_admin_write
  ON public.departements FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS presences_staff_read ON public.presences_personnel;
CREATE POLICY presences_staff_read
  ON public.presences_personnel FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS presences_staff_write ON public.presences_personnel;
CREATE POLICY presences_staff_write
  ON public.presences_personnel FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS conges_staff_read ON public.conges_personnel;
CREATE POLICY conges_staff_read
  ON public.conges_personnel FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS conges_staff_write ON public.conges_personnel;
CREATE POLICY conges_staff_write
  ON public.conges_personnel FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS missions_staff_read ON public.missions_transport;
CREATE POLICY missions_staff_read
  ON public.missions_transport FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS missions_staff_write ON public.missions_transport;
CREATE POLICY missions_staff_write
  ON public.missions_transport FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS depenses_finance_read ON public.depenses_administratives;
CREATE POLICY depenses_finance_read
  ON public.depenses_administratives FOR SELECT TO authenticated
  USING (public.can_manage_finance(auth.uid()));

DROP POLICY IF EXISTS depenses_finance_write ON public.depenses_administratives;
CREATE POLICY depenses_finance_write
  ON public.depenses_administratives FOR ALL TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));

DROP POLICY IF EXISTS budgets_finance_read ON public.budgets_annuels;
CREATE POLICY budgets_finance_read
  ON public.budgets_annuels FOR SELECT TO authenticated
  USING (public.can_manage_finance(auth.uid()));

DROP POLICY IF EXISTS budgets_finance_write ON public.budgets_annuels;
CREATE POLICY budgets_finance_write
  ON public.budgets_annuels FOR ALL TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));

-- Les sessions et logs d'authentification sont consultables par le staff,
-- mais leur alimentation doit être faite par un service de confiance.
DROP POLICY IF EXISTS user_sessions_staff_read ON public.user_sessions;
CREATE POLICY user_sessions_staff_read
  ON public.user_sessions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS auth_security_logs_staff_read ON public.auth_security_logs;
CREATE POLICY auth_security_logs_staff_read
  ON public.auth_security_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- La GED interne est réservée au personnel autorisé.
DROP POLICY IF EXISTS ged_documents_read ON public.ged_documents;
CREATE POLICY ged_documents_read
  ON public.ged_documents FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS ged_documents_write ON public.ged_documents;
CREATE POLICY ged_documents_write
  ON public.ged_documents FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS param_hist_read ON public.parametres_historique;
CREATE POLICY param_hist_read
  ON public.parametres_historique FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 7. DROITS EXPLICITES
-- ---------------------------------------------------------------------

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT INSERT ON public.callback_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.callback_requests TO authenticated;
GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT SELECT, UPDATE ON public.appointments TO authenticated;
GRANT INSERT ON public.chat_messages TO anon, authenticated;
GRANT SELECT ON public.chat_messages TO authenticated;
GRANT INSERT ON public.membership_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.membership_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_notification_preferences TO authenticated;

-- ---------------------------------------------------------------------
-- 8. VALEUR INITIALE DE LA PRÉSENTATION
-- ---------------------------------------------------------------------

INSERT INTO public.site_settings (key, value, is_public)
VALUES (
  'presentation_content',
  jsonb_build_object(
    'title', 'Une mutuelle solidaire, un centre de bien-être complet',
    'text', 'Depuis sa création, Humanitas met la solidarité au service de la santé. Nos adhérents bénéficient d''une couverture claire, d''un accompagnement personnalisé et d''un accès privilégié à des structures de soins sélectionnées pour leur qualité.',
    'pillars', jsonb_build_array(
      'Une mutuelle à but non lucratif, gouvernée par ses adhérents',
      'Un centre de bien-être dédié à la prévention et à la remise en forme',
      'Un réseau de soins conventionné, contrôlé par notre médecin conseil',
      'Une couverture adaptée aux familles, entreprises et institutions'
    )
  ),
  true
)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- FIN
-- ---------------------------------------------------------------------

-- =====================================================================
-- MIGRATION: MODULES PARTENAIRES, ADMINISTRATION RH, SÉCURITÉ ET APIS
-- PROMPTS 16 À 26
-- =====================================================================

-- 1. MODULE RH & ADMINISTRATION HUMANITAS (PROMPT 17)
CREATE TABLE IF NOT EXISTS public.departements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  description text,
  responsable_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.presences_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  date_presence date NOT NULL DEFAULT CURRENT_DATE,
  statut text NOT NULL DEFAULT 'present' CHECK (statut IN ('present', 'absent', 'retard', 'conge', 'mission')),
  heure_arrivee time,
  heure_depart time,
  observation text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(personnel_id, date_presence)
);

CREATE TABLE IF NOT EXISTS public.conges_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  type_conge text NOT NULL CHECK (type_conge IN ('annuel', 'maladie', 'maternite', 'circonstance', 'sans_solde')),
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  nombre_jours integer NOT NULL DEFAULT 1,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuve', 'refuse')),
  motif text,
  approuve_par uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.missions_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  destination text NOT NULL,
  motif text NOT NULL,
  date_depart date NOT NULL,
  date_retour date NOT NULL,
  frais_transport_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  statut text NOT NULL DEFAULT 'planifiee' CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'annulee')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.depenses_administratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie text NOT NULL CHECK (categorie IN ('salaires', 'loyer', 'transport', 'fournitures', 'energie', 'telecom', 'divers')),
  libelle text NOT NULL,
  montant_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  date_depense date NOT NULL DEFAULT CURRENT_DATE,
  valide_par uuid,
  piece_justificative text,
  statut text NOT NULL DEFAULT 'payee' CHECK (statut IN ('en_attente', 'validee', 'payee', 'rejetee')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.budgets_annuels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annee integer NOT NULL,
  departement text NOT NULL,
  montant_alloue_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  montant_engage_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  UNIQUE(annee, departement)
);

-- Interdiction de suppression physique des dépenses administratives (Prompt 12/17)
DROP TRIGGER IF EXISTS trg_prevent_delete_depenses ON public.depenses_administratives;
CREATE TRIGGER trg_prevent_delete_depenses
  BEFORE DELETE ON public.depenses_administratives
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_delete();


-- 2. MODULE SÉCURITÉ, SESSIONS & AUDIT (PROMPT 18 / PROMPT 26)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  user_agent text,
  geo_location text DEFAULT 'Kinshasa, RDC',
  is_active boolean DEFAULT true,
  connected_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.auth_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  event_type text NOT NULL CHECK (event_type IN ('connexion_succes', 'connexion_echec', 'deconnexion', 'changement_mdp', 'tentative_suspecte', 'blocage_compte')),
  ip_address text,
  geo_location text DEFAULT 'Kinshasa, RDC',
  details text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  attempts_count integer DEFAULT 1,
  locked_until timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, ip_address)
);

-- RLS Sécurité
ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presences_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conges_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses_administratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets_annuels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture_authenticated_rh" ON public.departements FOR SELECT TO authenticated USING (true);
CREATE POLICY "lecture_authenticated_presences" ON public.presences_personnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "ecriture_staff_presences" ON public.presences_personnel FOR ALL TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "lecture_conges" ON public.conges_personnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "ecriture_conges" ON public.conges_personnel FOR ALL TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "lecture_depenses" ON public.depenses_administratives FOR SELECT TO authenticated USING (public.can_manage_finance(auth.uid()));
CREATE POLICY "ecriture_depenses" ON public.depenses_administratives FOR ALL TO authenticated USING (public.can_manage_finance(auth.uid()));


-- 3. MODULE GESTION DOCUMENTAIRE (GED) (PROMPT 23)
CREATE TABLE IF NOT EXISTS public.ged_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  categorie text NOT NULL CHECK (categorie IN ('photo_adherent', 'photo_personnel', 'carte_imprimee', 'contrat', 'piece_identite', 'ordonnance', 'facture', 'recu', 'justificatif')),
  bucket_id text NOT NULL DEFAULT 'documents_humanitas',
  file_path text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  file_size_kb integer DEFAULT 0,
  owner_id uuid,
  adherent_id uuid REFERENCES public.adherents(id) ON DELETE SET NULL,
  partenaire_id uuid REFERENCES public.partenaires(id) ON DELETE SET NULL,
  version integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ged_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ged_documents_read" ON public.ged_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "ged_documents_write" ON public.ged_documents FOR ALL TO authenticated USING (public.is_staff(auth.uid()));


-- 4. HISTORISATION DES PARAMÈTRES SYSTÈME (PROMPT 21)
CREATE TABLE IF NOT EXISTS public.parametres_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parametre_key text NOT NULL,
  valeur_ancienne text,
  valeur_nouvelle text NOT NULL,
  modifie_par uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.parametres_historique ENABLE ROW LEVEL SECURITY;
CREATE POLICY "param_hist_read" ON public.parametres_historique FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


-- 5. PRÉFÉRENCES ET CENTRE DE NOTIFICATIONS (PROMPT 20)
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id uuid PRIMARY KEY,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT true,
  app_enabled boolean DEFAULT true,
  rappel_echeance_5 boolean DEFAULT true,
  alertes_securite boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Enregistrer par défaut un jeu de départements Humanitas
INSERT INTO public.departements (code, nom, description)
VALUES 
  ('DIR_GEN', 'Direction Générale', 'Supervision stratégique et administrative'),
  ('MED_CONS', 'Médecine Conseil', 'Validation médicale et contrôle des actes'),
  ('FIN_COMPT', 'Finance & Comptabilité', 'Gestion des fonds, trésorerie et budget'),
  ('RH_ADMIN', 'Ressources Humaines', 'Gestion du personnel, paie et présences'),
  ('COORDIN', 'Coordination & Réseau', 'Relations partenaires, adhésions et cartes')
ON CONFLICT (code) DO NOTHING;

GRANT SELECT ON public.departements TO authenticated, anon;
GRANT ALL ON public.presences_personnel TO authenticated;
GRANT ALL ON public.conges_personnel TO authenticated;
GRANT ALL ON public.missions_transport TO authenticated;
GRANT ALL ON public.depenses_administratives TO authenticated;
GRANT ALL ON public.budgets_annuels TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.auth_security_logs TO authenticated;
GRANT ALL ON public.ged_documents TO authenticated;

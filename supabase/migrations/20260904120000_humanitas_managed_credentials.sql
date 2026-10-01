-- HUMANITAS SANTÉ — Comptes gérés lors de la première adhésion
-- L'identifiant est public/applicatif ; le mot de passe temporaire reste uniquement dans Supabase Auth.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

COMMENT ON COLUMN public.profiles.username IS
  'Identifiant Humanitas unique utilisé pour la connexion des comptes gérés.';

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
           WHEN ur.role = 'adherent' AND p.type = 'pharmacie' THEN 'hopital'
           WHEN ur.role = 'adherent' AND p.type = 'laboratoire' THEN 'hopital'
           WHEN ur.role = 'adherent' AND p.type = 'centre_bien_etre' THEN 'hopital'
           ELSE 'staff'
         END AS contexte,
         a.id AS adherent_id,
         b.id AS beneficiaire_id,
         pm.partenaire_id,
         COALESCE(pf.username, b.code, a.matricule) AS identifiant
  FROM public.user_roles ur
  LEFT JOIN public.profiles pf ON pf.id = ur.user_id
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
      ur.role IN ('super_admin','administrateur','directeur_general','coordonnateur','medecin_conseil','financier','agent_humanitas')
      OR (ur.role = 'adherent' AND (a.id IS NOT NULL OR b.id IS NOT NULL))
      OR (ur.role IN ('hopital','entreprise') AND pm.id IS NOT NULL)
    );
$$;

REVOKE ALL ON FUNCTION public.mon_contexte_compte() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_contexte_compte() TO authenticated;

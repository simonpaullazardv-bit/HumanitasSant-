-- HUMANITAS — Direction Générale, politiques et publication publique
CREATE OR REPLACE FUNCTION public.is_directeur_general(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'directeur_general'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_strategic_data(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_directeur_general(_user_id)
      OR public.is_admin(_user_id);
$$;

-- Le DG est un membre du personnel au sens de la lecture opérationnelle,
-- sans devenir administrateur technique.
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'super_admin','administrateur','directeur_general','coordonnateur',
        'medecin_conseil','financier','agent_humanitas'
      )
  );
$$;

-- L'accès audit du DG est explicitement en lecture stratégique.
DROP POLICY IF EXISTS "audit_read_admin" ON public.audit_logs;
CREATE POLICY "audit_read_admin_or_dg"
ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_directeur_general(auth.uid()));

-- Le contenu public reste publiable uniquement lorsqu'un administrateur
-- le valide explicitement. Aucun chiffre inventé n'est inséré par cette migration.
COMMENT ON TABLE public.site_settings IS
'Paramètres institutionnels et contenu public. Les valeurs publiées doivent être validées par Humanitas. Ne jamais seed automatiquement des statistiques non sourcées.';

INSERT INTO public.site_settings (key, value, is_public)
VALUES
  ('public_director_general', '{}'::jsonb, false),
  ('public_contact', '{}'::jsonb, false),
  ('public_address', '{}'::jsonb, false),
  ('public_statistics', '{}'::jsonb, false),
  ('public_gallery_policy', jsonb_build_object('random_rotation', true, 'source', 'gallery_images'), true)
ON CONFLICT (key) DO NOTHING;

-- Documentation embarquée dans le schéma : ces clés sont des emplacements
-- de données officielles, pas des valeurs de démonstration.
COMMENT ON COLUMN public.site_settings.value IS
'JSONB contrôlé par l''administration. Les clés public_* ne deviennent visibles au public que si is_public=true et après validation officielle.';

-- Sécurité : un DG ne peut pas s'attribuer lui-même un rôle, ni modifier
-- les paramètres via la policy admin existante.
COMMENT ON FUNCTION public.is_directeur_general(uuid) IS
'Identifie exclusivement le rôle directeur_general. Séparé de is_admin afin de préserver la séparation des pouvoirs.';
COMMENT ON FUNCTION public.can_view_strategic_data(uuid) IS
'Autorise la lecture stratégique au Directeur Général ou à un administrateur.';

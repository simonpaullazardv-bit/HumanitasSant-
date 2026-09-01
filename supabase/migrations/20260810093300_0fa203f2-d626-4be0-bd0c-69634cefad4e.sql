-- Retirer l'exécution publique par défaut sur toutes les fonctions SECURITY DEFINER
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_adherents(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_finance(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_adherent(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Ré-accorder uniquement aux rôles qui en ont besoin dans les policies RLS
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_adherents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_finance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_adherent(uuid, uuid) TO authenticated;
-- is_staff est évalué dans les policies de lecture publique (tarifs, partenaires)
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated;
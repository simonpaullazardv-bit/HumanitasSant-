REVOKE EXECUTE ON FUNCTION public.next_matricule() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_adherent_matricule() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_adherents() FROM PUBLIC, anon, authenticated;
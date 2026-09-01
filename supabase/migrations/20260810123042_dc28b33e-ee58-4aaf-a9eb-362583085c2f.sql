REVOKE EXECUTE ON FUNCTION public.partenaires_de(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.appartient_partenaire(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.contrat_valide(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.contrat_actif_partenaire(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partenaires_de(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.appartient_partenaire(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contrat_valide(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contrat_actif_partenaire(uuid) TO authenticated;
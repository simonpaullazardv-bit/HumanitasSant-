-- HUMANITAS SANTÉ — Première connexion sécurisée
-- Un compte créé par un opérateur doit pouvoir recevoir un mot de passe temporaire.
-- Le mot de passe lui-même reste exclusivement dans Supabase Auth et n'est jamais stocké en clair.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_initialized_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.force_password_change IS
  'Impose le changement du mot de passe temporaire lors de la première connexion.';

COMMENT ON COLUMN public.profiles.password_initialized_at IS
  'Date à laquelle l''utilisateur a initialisé son mot de passe personnel.';

CREATE OR REPLACE FUNCTION public.mark_password_initialized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET force_password_change = false,
      password_initialized_at = now(),
      updated_at = now()
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.mark_password_initialized() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_password_initialized() TO authenticated;

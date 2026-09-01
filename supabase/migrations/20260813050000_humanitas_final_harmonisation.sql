-- HUMANITAS — Harmonisation finale DBA
-- Cette migration ne crée ni table entreprise, ni table membre_couvert.
-- Les entreprises sont des partenaires de type entreprise et un membre couvert
-- reste un adherent via adherents.entreprise_id.

-- Garantit qu'un lien entreprise d'un adhérent pointe vers un partenaire de type entreprise.
CREATE OR REPLACE FUNCTION public.validate_adherent_entreprise()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.entreprise_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.partenaires p
    WHERE p.id = NEW.entreprise_id AND p.type = 'entreprise'
  ) THEN
    RAISE EXCEPTION 'entreprise_id doit référencer un partenaire de type entreprise'
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adherents_entreprise_type ON public.adherents;
CREATE TRIGGER trg_adherents_entreprise_type
BEFORE INSERT OR UPDATE OF entreprise_id ON public.adherents
FOR EACH ROW EXECUTE FUNCTION public.validate_adherent_entreprise();

-- Le catalogue métier officiel reste Bronze / Argent / Or / Platine.
UPDATE public.categories_adhesion SET is_active = true
WHERE LOWER(code::text) IN ('bronze','argent','or','platine');
UPDATE public.categories_adhesion SET is_active = false
WHERE LOWER(code::text) = 'diamant';

COMMENT ON TABLE public.partenaire_membres IS
'Rattachement technique des comptes utilisateurs aux partenaires pour les permissions/RLS. Ce n''est pas la table des membres couverts : les membres couverts sont des adherents via adherents.entreprise_id.';

COMMENT ON COLUMN public.adherents.entreprise_id IS
'Partenaire de type entreprise couvrant éventuellement cet adhérent. NULL pour un adhérent individuel.';

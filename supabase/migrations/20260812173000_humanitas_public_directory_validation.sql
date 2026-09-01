-- =====================================================================
-- HUMANITAS — Validation explicite des données publiques du réseau
-- =====================================================================
-- Une structure partenaire peut exister dans la base opérationnelle sans
-- être autorisée à apparaître sur le site public. is_public sépare ces deux
-- notions et évite de publier par accident un téléphone/adresse non validé.
-- =====================================================================

ALTER TABLE public.partenaires
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_partenaires_public
  ON public.partenaires(is_public, ordre)
  WHERE is_active = true;

DROP POLICY IF EXISTS "partenaires_public_read" ON public.partenaires;
CREATE POLICY "partenaires_public_read_validated"
ON public.partenaires
FOR SELECT TO anon, authenticated
USING (
  (is_active AND is_public)
  OR public.is_staff(auth.uid())
);

COMMENT ON COLUMN public.partenaires.is_public IS
'Publication publique explicite après validation Humanitas. Une adresse, un téléphone ou un partenaire non validé reste privé même si le partenaire est actif opérationnellement.';

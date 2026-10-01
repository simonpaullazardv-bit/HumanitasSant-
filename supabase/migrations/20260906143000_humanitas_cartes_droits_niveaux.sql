-- Étape 3 : droits métier des cartes et impressions Humanitas
-- Règle validée : DG, Finance et Coordination peuvent imprimer les cartes.
-- L’agent terrain ne peut pas gérer ni imprimer les cartes.
-- Les cartes du personnel restent réservées à la Direction / Administration.

DROP POLICY IF EXISTS "cartes_manage" ON public.cartes_membre;
CREATE POLICY "cartes_manage_humanitas_niveaux"
ON public.cartes_membre
FOR ALL TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY[
    'super_admin'::public.app_role,
    'administrateur'::public.app_role,
    'directeur_general'::public.app_role,
    'coordonnateur'::public.app_role,
    'financier'::public.app_role
  ])
)
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY[
    'super_admin'::public.app_role,
    'administrateur'::public.app_role,
    'directeur_general'::public.app_role,
    'coordonnateur'::public.app_role,
    'financier'::public.app_role
  ])
);

-- Les agents terrain sont explicitement exclus de la gestion des cartes.
-- La lecture personnelle des cartes adhérent/bénéficiaire reste couverte par la policy cartes_read.

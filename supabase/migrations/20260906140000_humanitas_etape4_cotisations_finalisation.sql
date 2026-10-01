-- HUMANITAS V5.3 - ETAPE 4
-- Finalisation des cotisations : période mensuelle, échéance du 5,
-- retards, alertes et état des droits. Cette migration complète les routines
-- existantes sans supprimer les données ni les règles RLS déjà en place.

SET search_path = public;

-- 1) Normaliser chaque cotisation sur le premier jour du mois et fixer
-- l'échéance au 5 de ce même mois.
CREATE OR REPLACE FUNCTION public.normaliser_cotisation_mensuelle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.periode := date_trunc('month', NEW.periode)::date;
  NEW.echeance := (date_trunc('month', NEW.periode)::date + 4);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normaliser_cotisation_mensuelle ON public.cotisations;
CREATE TRIGGER trg_normaliser_cotisation_mensuelle
BEFORE INSERT OR UPDATE OF periode ON public.cotisations
FOR EACH ROW EXECUTE FUNCTION public.normaliser_cotisation_mensuelle();

-- 2) Traitement sécurisé des retards. Seuls les responsables financiers
-- peuvent lancer la routine. Chaque ligne échue est marquée une seule fois.
CREATE OR REPLACE FUNCTION public.traiter_retards()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  IF NOT public.can_manage_finance(auth.uid()) THEN
    RAISE EXCEPTION 'Routine réservée à la gestion financière.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  FOR r IN
    SELECT c.id, c.adherent_id, c.periode
    FROM public.cotisations c
    WHERE c.echeance < current_date
      AND c.statut IN ('due','partielle')
    FOR UPDATE
  LOOP
    UPDATE public.cotisations
       SET statut = 'en_retard'
     WHERE id = r.id;

    INSERT INTO public.alertes_financieres
      (adherent_id, cotisation_id, type, niveau, message)
    SELECT
      r.adherent_id,
      r.id,
      'cotisation_en_retard',
      'critique',
      'Cotisation de ' || to_char(r.periode, 'MM/YYYY') || ' impayée après l''échéance du 5.'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.alertes_financieres a
      WHERE a.cotisation_id = r.id
        AND a.type = 'cotisation_en_retard'
    );

    PERFORM public.recalculer_solde(r.adherent_id);
    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;

-- 3) Etat métier des droits liés aux cotisations.
-- standard          : au moins 3 mensualités payées et aucun retard ouvert
-- sous_avis_medical : au moins 3 mensualités payées mais un retard persiste
-- carence            : moins de 3 mensualités payées
CREATE OR REPLACE FUNCTION public.etat_droits_cotisation(_adherent_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mensualites integer := 0;
  v_retards integer := 0;
  v_etat text;
BEGIN
  SELECT COUNT(DISTINCT periode)
    INTO v_mensualites
  FROM public.cotisations
  WHERE adherent_id = _adherent_id
    AND statut = 'payee';

  SELECT COUNT(*)
    INTO v_retards
  FROM public.cotisations
  WHERE adherent_id = _adherent_id
    AND statut IN ('due','partielle','en_retard')
    AND echeance < current_date;

  IF v_mensualites < 3 THEN
    v_etat := 'carence';
  ELSIF v_retards > 0 THEN
    v_etat := 'sous_avis_medical';
  ELSE
    v_etat := 'standard';
  END IF;

  RETURN jsonb_build_object(
    'mensualites_validees', v_mensualites,
    'retards_ouverts', v_retards,
    'etat', v_etat,
    'echeance_reglementaire', 5
  );
END;
$$;

REVOKE ALL ON FUNCTION public.traiter_retards() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.traiter_retards() TO authenticated;
REVOKE ALL ON FUNCTION public.etat_droits_cotisation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.etat_droits_cotisation(uuid) TO authenticated;

COMMENT ON FUNCTION public.etat_droits_cotisation(uuid) IS
'Etape 4 Humanitas : état métier calculé des cotisations. Trois mensualités ouvrent la sortie de carence ; un retard persistant impose le statut sous_avis_medical pour le traitement métier ultérieur.';

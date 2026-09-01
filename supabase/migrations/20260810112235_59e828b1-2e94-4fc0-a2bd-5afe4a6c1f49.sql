CREATE OR REPLACE FUNCTION public.audit_adherents()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aid uuid; bid uuid; evt text;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entite, entite_id, details)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    )
  );

  IF TG_OP <> 'DELETE' THEN
    IF TG_TABLE_NAME = 'adherents' THEN
      aid := NEW.id; bid := NULL;
    ELSE
      aid := NEW.adherent_id; bid := NEW.id;
    END IF;

    evt := lower(TG_OP) || '_' || TG_TABLE_NAME;

    INSERT INTO public.adherent_historique (adherent_id, beneficiaire_id, evenement, ancien_statut, nouveau_statut, details, created_by)
    VALUES (
      aid, bid, evt,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.statut::text END,
      NEW.statut::text, '{}'::jsonb, auth.uid()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END; $$;

REVOKE EXECUTE ON FUNCTION public.audit_adherents() FROM PUBLIC, anon, authenticated;
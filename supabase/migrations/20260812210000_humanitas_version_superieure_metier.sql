-- =====================================================================
-- HUMANITAS — Version supérieure métier / DBA
-- 2026-08-12
--
-- Migration additive : ne remplace aucune migration historique.
-- Objectifs :
--   1. Séparer les espaces Hôpital / Pharmacie / Laboratoire / Centre
--      de bien-être par rôle + partenaire_id.
--   2. Renforcer le cloisonnement des données partenaires.
--   3. Enrichir la vérification QR/code sans exposer de données inutiles.
--   4. Rendre la demande publique d'adhésion minimale et réserver la
--      réponse au Coordonnateur.
--   5. Préparer le pilotage financier DG par données réelles et filtres.
--   6. Ajouter les coordonnées géographiques des partenaires, sans
--      inventer de coordonnées.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RÔLES PARTENAIRES DISTINCTS
-- ---------------------------------------------------------------------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pharmacie';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'laboratoire';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'centre_bien_etre';

-- ---------------------------------------------------------------------
-- 2. GÉOLOCALISATION DES PARTENAIRES
-- ---------------------------------------------------------------------
ALTER TABLE public.partenaires
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6);

ALTER TABLE public.partenaires
  DROP CONSTRAINT IF EXISTS partenaires_latitude_check;
ALTER TABLE public.partenaires
  ADD CONSTRAINT partenaires_latitude_check
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);

ALTER TABLE public.partenaires
  DROP CONSTRAINT IF EXISTS partenaires_longitude_check;
ALTER TABLE public.partenaires
  ADD CONSTRAINT partenaires_longitude_check
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

CREATE INDEX IF NOT EXISTS idx_partenaires_geo
  ON public.partenaires(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN public.partenaires.latitude IS
  'Latitude WGS84 vérifiée. NULL tant qu''elle n''a pas été validée par Humanitas.';
COMMENT ON COLUMN public.partenaires.longitude IS
  'Longitude WGS84 vérifiée. NULL tant qu''elle n''a pas été validée par Humanitas.';

-- ---------------------------------------------------------------------
-- 3. CORRESPONDANCE RÔLE ↔ TYPE DE PARTENAIRE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.partenaire_role_compatible(
  _user_id uuid,
  _partenaire_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partenaire_membres pm
    JOIN public.partenaires p ON p.id = pm.partenaire_id
    JOIN public.user_roles ur ON ur.user_id = pm.user_id
    WHERE pm.user_id = _user_id
      AND pm.partenaire_id = _partenaire_id
      AND pm.is_active = true
      AND ur.role::text = CASE p.type::text
        WHEN 'hopital' THEN 'hopital'
        WHEN 'pharmacie' THEN 'pharmacie'
        WHEN 'laboratoire' THEN 'laboratoire'
        WHEN 'centre_bien_etre' THEN 'centre_bien_etre'
        WHEN 'entreprise' THEN 'entreprise'
        ELSE ''
      END
  );
$$;

REVOKE ALL ON FUNCTION public.partenaire_role_compatible(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partenaire_role_compatible(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.partenaire_role_compatible(uuid, uuid) IS
  'Vérifie simultanément le rattachement métier et la compatibilité entre le rôle de connexion et le type du partenaire.';

-- ---------------------------------------------------------------------
-- 4. CONTEXTE DE COMPTE : quatre espaces de soins distincts
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mon_contexte_compte()
RETURNS TABLE (
  role public.app_role,
  contexte text,
  adherent_id uuid,
  beneficiaire_id uuid,
  partenaire_id uuid,
  identifiant text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ur.role,
    CASE
      WHEN ur.role = 'adherent' AND b.id IS NOT NULL THEN 'beneficiaire'
      WHEN ur.role = 'adherent' AND a.id IS NOT NULL THEN 'adherent'
      WHEN ur.role::text IN ('hopital','pharmacie','laboratoire','centre_bien_etre','entreprise')
           AND pm.partenaire_id IS NOT NULL
        THEN ur.role::text
      ELSE 'staff'
    END AS contexte,
    a.id AS adherent_id,
    b.id AS beneficiaire_id,
    pm.partenaire_id,
    COALESCE(b.code, a.matricule, p.numero)
  FROM public.user_roles ur
  LEFT JOIN LATERAL (
    SELECT a1.id, a1.matricule
    FROM public.adherents a1
    WHERE a1.user_id = ur.user_id
    ORDER BY a1.created_at DESC
    LIMIT 1
  ) a ON true
  LEFT JOIN LATERAL (
    SELECT b1.id, b1.code
    FROM public.beneficiaires b1
    WHERE b1.user_id = ur.user_id AND b1.is_active = true
    ORDER BY b1.updated_at DESC NULLS LAST, b1.created_at DESC
    LIMIT 1
  ) b ON true
  LEFT JOIN LATERAL (
    SELECT pm1.partenaire_id
    FROM public.partenaire_membres pm1
    WHERE pm1.user_id = ur.user_id AND pm1.is_active = true
    ORDER BY pm1.created_at DESC
    LIMIT 1
  ) pm ON true
  LEFT JOIN public.partenaires p ON p.id = pm.partenaire_id
  WHERE ur.user_id = auth.uid()
    AND (
      ur.role IN (
        'super_admin','administrateur','directeur_general','coordonnateur',
        'medecin_conseil','financier','agent_humanitas'
      )
      OR (ur.role = 'adherent' AND (a.id IS NOT NULL OR b.id IS NOT NULL))
      OR (
        ur.role::text IN ('hopital','pharmacie','laboratoire','centre_bien_etre','entreprise')
        AND pm.partenaire_id IS NOT NULL
        AND public.partenaire_role_compatible(auth.uid(), pm.partenaire_id)
      )
    )
  ORDER BY CASE ur.role::text
    WHEN 'super_admin' THEN 1
    WHEN 'administrateur' THEN 2
    WHEN 'directeur_general' THEN 3
    WHEN 'coordonnateur' THEN 4
    WHEN 'medecin_conseil' THEN 5
    WHEN 'financier' THEN 6
    WHEN 'agent_humanitas' THEN 7
    WHEN 'entreprise' THEN 8
    WHEN 'hopital' THEN 9
    WHEN 'pharmacie' THEN 10
    WHEN 'laboratoire' THEN 11
    WHEN 'centre_bien_etre' THEN 12
    WHEN 'adherent' THEN 13
    ELSE 99
  END;
$$;

-- ---------------------------------------------------------------------
-- 5. RLS PARTENAIRES : remplacement des policies de rattachement par
-- des policies qui vérifient également le rôle métier.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Partenaire voit ses contrats" ON public.contrats_partenaires;
CREATE POLICY "Partenaire voit ses contrats"
ON public.contrats_partenaires
FOR SELECT TO authenticated
USING (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire lit ses contrats" ON public.contrats_partenaires;
CREATE POLICY "Partenaire lit ses contrats"
ON public.contrats_partenaires
FOR SELECT TO authenticated
USING (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire voit ses documents" ON public.partenaire_documents;
CREATE POLICY "Partenaire voit ses documents"
ON public.partenaire_documents
FOR SELECT TO authenticated
USING (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire lit son historique" ON public.partenaire_historique;
CREATE POLICY "Partenaire lit son historique"
ON public.partenaire_historique
FOR SELECT TO authenticated
USING (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire lit ses prises en charge" ON public.prises_en_charge;
CREATE POLICY "Partenaire lit ses prises en charge"
ON public.prises_en_charge
FOR SELECT TO authenticated
USING (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire cree ses prises en charge" ON public.prises_en_charge;
CREATE POLICY "Partenaire cree ses prises en charge"
ON public.prises_en_charge
FOR INSERT TO authenticated
WITH CHECK (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire lit ses factures" ON public.factures_partenaires;
CREATE POLICY "Partenaire lit ses factures"
ON public.factures_partenaires
FOR SELECT TO authenticated
USING (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire soumet ses factures" ON public.factures_partenaires;
CREATE POLICY "Partenaire soumet ses factures"
ON public.factures_partenaires
FOR INSERT TO authenticated
WITH CHECK (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire lit ses notifications" ON public.partenaire_notifications;
CREATE POLICY "Partenaire lit ses notifications"
ON public.partenaire_notifications
FOR SELECT TO authenticated
USING (public.partenaire_role_compatible(auth.uid(), partenaire_id));

DROP POLICY IF EXISTS "Partenaire marque ses notifications" ON public.partenaire_notifications;
CREATE POLICY "Partenaire marque ses notifications"
ON public.partenaire_notifications
FOR UPDATE TO authenticated
USING (public.partenaire_role_compatible(auth.uid(), partenaire_id))
WITH CHECK (public.partenaire_role_compatible(auth.uid(), partenaire_id));

-- Les ordres de remboursement restent visibles aux établissements
-- rattachés uniquement, sans ouvrir l'écriture.
DROP POLICY IF EXISTS "Partenaire lit ses ordres" ON public.ordres_remboursement;
CREATE POLICY "Partenaire lit ses ordres"
ON public.ordres_remboursement
FOR SELECT TO authenticated
USING (
  public.partenaire_role_compatible(auth.uid(), partenaire_id)
  OR public.is_staff(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.prises_en_charge p
    WHERE p.id = prise_en_charge_id
      AND (
        public.owns_adherent(auth.uid(), p.adherent_id)
        OR public.owns_beneficiaire(auth.uid(), p.beneficiaire_id)
      )
  )
);

-- ---------------------------------------------------------------------
-- 6. VÉRIFICATION QR / CODE : état de couverture + photo publiée au
-- strict nécessaire pour l'accueil, jamais la situation financière.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.partenaire_verifier_code(
  _partenaire_id uuid,
  _code text DEFAULT NULL,
  _token uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contrat record;
  v_adherent record;
  v_beneficiaire record;
  v_carte record;
  v_categorie record;
  v_endette boolean := false;
  v_etat text;
BEGIN
  IF NOT public.partenaire_role_compatible(auth.uid(), _partenaire_id)
     AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Accès partenaire non autorisé' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT c.* INTO v_contrat
  FROM public.contrats_partenaires c
  WHERE c.partenaire_id = _partenaire_id
    AND c.statut = 'actif'
    AND c.date_debut <= current_date
    AND (c.date_fin IS NULL OR c.date_fin >= current_date)
  ORDER BY c.date_debut DESC
  LIMIT 1;

  IF v_contrat.id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'motifs', jsonb_build_array('Aucun contrat partenaire valide'));
  END IF;

  IF _token IS NOT NULL THEN
    SELECT a.* INTO v_adherent
    FROM public.cartes_membre cm
    JOIN public.adherents a ON a.id = cm.adherent_id
    WHERE cm.qr_token = _token AND cm.statut = 'active'
    LIMIT 1;

    IF v_adherent.id IS NULL THEN
      SELECT b.* INTO v_beneficiaire
      FROM public.cartes_membre cm
      JOIN public.beneficiaires b ON b.id = cm.beneficiaire_id
      WHERE cm.qr_token = _token AND cm.statut = 'active' AND b.is_active = true
      LIMIT 1;
    END IF;
  ELSE
    SELECT a.* INTO v_adherent
    FROM public.adherents a
    WHERE upper(btrim(a.matricule)) = upper(btrim(_code))
    LIMIT 1;
  END IF;

  IF v_adherent.id IS NOT NULL THEN
    SELECT cm.* INTO v_carte
    FROM public.cartes_membre cm
    WHERE cm.adherent_id = v_adherent.id AND cm.statut = 'active'
    ORDER BY cm.date_emission DESC LIMIT 1;

    SELECT cat.* INTO v_categorie FROM public.categories_adhesion cat WHERE cat.id = v_adherent.categorie_id;
    SELECT EXISTS (
      SELECT 1 FROM public.cotisations c
      WHERE c.adherent_id = v_adherent.id AND c.statut = 'en_retard' AND c.montant_paye < c.montant_usd
    ) INTO v_endette;
    v_etat := CASE
      WHEN v_adherent.statut = 'actif' AND v_endette THEN 'endette'
      WHEN v_adherent.statut = 'actif' THEN 'actif'
      WHEN v_adherent.statut = 'en_attente' THEN 'en_cours'
      WHEN v_adherent.statut = 'expire' THEN 'expire'
      WHEN v_adherent.statut = 'suspendu' THEN 'suspendu'
      WHEN v_adherent.statut = 'resilie' THEN 'resilie'
      ELSE v_adherent.statut::text
    END;

    RETURN jsonb_build_object(
      'eligible', v_adherent.statut = 'actif' AND NOT v_endette AND v_carte.id IS NOT NULL
        AND v_carte.statut = 'active' AND (v_carte.date_expiration IS NULL OR v_carte.date_expiration >= current_date),
      'type_personne', 'adherent',
      'adherent_id', v_adherent.id,
      'beneficiaire_id', NULL,
      'matricule', v_adherent.matricule,
      'code', v_adherent.matricule,
      'titulaire', concat_ws(' ', v_adherent.nom, v_adherent.postnom, v_adherent.prenom),
      'photo_url', v_adherent.photo_url,
      'statut', v_adherent.statut,
      'etat_couverture', v_etat,
      'categorie', CASE WHEN v_categorie.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_categorie.id, 'nom', v_categorie.nom) END,
      'carte', CASE WHEN v_carte.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_carte.id, 'numero', v_carte.numero, 'statut', v_carte.statut, 'date_expiration', v_carte.date_expiration) END,
      'message', CASE WHEN v_adherent.statut = 'actif' AND NOT v_endette AND v_carte.id IS NOT NULL THEN 'Droits ouverts' ELSE 'Droits à vérifier' END
    );
  END IF;

  IF v_beneficiaire.id IS NULL THEN
    SELECT b.*, a.matricule AS adherent_matricule, a.statut AS adherent_statut, a.photo_url AS adherent_photo_url
    INTO v_beneficiaire
    FROM public.beneficiaires b
    JOIN public.adherents a ON a.id = b.adherent_id
    WHERE b.is_active = true AND upper(btrim(coalesce(b.code, ''))) = upper(btrim(_code))
    LIMIT 1;
  ELSE
    SELECT b.*, a.matricule AS adherent_matricule, a.statut AS adherent_statut, a.photo_url AS adherent_photo_url
    INTO v_beneficiaire
    FROM public.beneficiaires b
    JOIN public.adherents a ON a.id = b.adherent_id
    WHERE b.id = v_beneficiaire.id LIMIT 1;
  END IF;

  IF v_beneficiaire.id IS NOT NULL THEN
    SELECT cm.* INTO v_carte FROM public.cartes_membre cm
      WHERE cm.beneficiaire_id = v_beneficiaire.id AND cm.statut = 'active'
      ORDER BY cm.date_emission DESC LIMIT 1;
    SELECT cat.* INTO v_categorie FROM public.categories_adhesion cat
      JOIN public.adherents a ON a.categorie_id = cat.id WHERE a.id = v_beneficiaire.adherent_id;
    SELECT EXISTS (
      SELECT 1 FROM public.cotisations c
      WHERE c.adherent_id = v_beneficiaire.adherent_id AND c.statut = 'en_retard' AND c.montant_paye < c.montant_usd
    ) INTO v_endette;
    v_etat := CASE
      WHEN v_beneficiaire.is_active AND v_beneficiaire.adherent_statut = 'actif' AND v_endette THEN 'endette'
      WHEN v_beneficiaire.is_active AND v_beneficiaire.adherent_statut = 'actif' THEN 'actif'
      WHEN v_beneficiaire.adherent_statut = 'en_attente' THEN 'en_cours'
      WHEN v_beneficiaire.adherent_statut = 'expire' THEN 'expire'
      WHEN v_beneficiaire.adherent_statut = 'suspendu' THEN 'suspendu'
      ELSE 'inactif'
    END;

    RETURN jsonb_build_object(
      'eligible', v_beneficiaire.is_active AND v_beneficiaire.adherent_statut = 'actif' AND NOT v_endette
        AND v_carte.id IS NOT NULL AND v_carte.statut = 'active'
        AND (v_carte.date_expiration IS NULL OR v_carte.date_expiration >= current_date),
      'type_personne', 'beneficiaire',
      'adherent_id', v_beneficiaire.adherent_id,
      'beneficiaire_id', v_beneficiaire.id,
      'matricule', v_beneficiaire.adherent_matricule,
      'code', v_beneficiaire.code,
      'titulaire', concat_ws(' ', v_beneficiaire.nom, v_beneficiaire.prenom),
      'photo_url', COALESCE(v_beneficiaire.photo_url, v_beneficiaire.adherent_photo_url),
      'statut', CASE WHEN v_beneficiaire.is_active AND v_beneficiaire.adherent_statut = 'actif' THEN 'actif' ELSE 'inactif' END,
      'etat_couverture', v_etat,
      'statut_adherent', v_beneficiaire.adherent_statut,
      'categorie', CASE WHEN v_categorie.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_categorie.id, 'nom', v_categorie.nom) END,
      'carte', CASE WHEN v_carte.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_carte.id, 'numero', v_carte.numero, 'statut', v_carte.statut, 'date_expiration', v_carte.date_expiration) END,
      'message', CASE WHEN v_beneficiaire.is_active AND v_beneficiaire.adherent_statut = 'actif' AND NOT v_endette AND v_carte.id IS NOT NULL THEN 'Droits ouverts' ELSE 'Droits à vérifier' END
    );
  END IF;

  RETURN jsonb_build_object('eligible', false, 'motifs', jsonb_build_array('Code Humanitas introuvable'));
END;
$$;

REVOKE ALL ON FUNCTION public.partenaire_verifier_code(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partenaire_verifier_code(uuid, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 7. DEMANDES D'ADHÉSION PUBLIQUES : formulaire minimal et réponse
-- exclusivement par le Coordonnateur.
-- ---------------------------------------------------------------------
ALTER TABLE public.membership_requests
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.membership_requests
  ADD COLUMN IF NOT EXISTS response_message text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

ALTER TABLE public.membership_requests
  DROP CONSTRAINT IF EXISTS membership_requests_contact_check;
ALTER TABLE public.membership_requests
  ADD CONSTRAINT membership_requests_contact_check
  CHECK (NULLIF(btrim(email), '') IS NOT NULL OR NULLIF(btrim(phone), '') IS NOT NULL);

DROP POLICY IF EXISTS membership_requests_staff_update ON public.membership_requests;
CREATE POLICY membership_requests_coordonnateur_update
ON public.membership_requests
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'coordonnateur'))
WITH CHECK (
  public.has_role(auth.uid(), 'coordonnateur')
  AND reviewed_by = auth.uid()
);

-- Le staff peut lire la boîte de demandes, mais pas répondre par UPDATE.
-- L'insertion publique reste volontairement limitée aux champs du formulaire
-- côté frontend ; RLS ne fait jamais confiance au client pour reviewed_by.
DROP POLICY IF EXISTS membership_requests_staff_read ON public.membership_requests;
CREATE POLICY membership_requests_staff_read
ON public.membership_requests
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()) OR public.is_directeur_general(auth.uid()));

DROP POLICY IF EXISTS membership_requests_public_insert ON public.membership_requests;
CREATE POLICY membership_requests_public_insert
ON public.membership_requests
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND reviewed_by IS NULL
  AND response_message IS NULL
  AND responded_at IS NULL
);

GRANT SELECT ON public.membership_requests TO authenticated;
GRANT UPDATE ON public.membership_requests TO authenticated;

-- ---------------------------------------------------------------------
-- 8. FLUX FINANCIER DG : vue détaillée filtrable par date.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dg_flux_financier(
  _date_debut date DEFAULT NULL,
  _date_fin date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  date_operation timestamptz,
  sens text,
  type_operation text,
  affectation text,
  montant_usd numeric,
  devise text,
  libelle text,
  adherent_id uuid,
  paiement_id uuid,
  cotisation_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.created_at,
    o.sens,
    o.type_operation,
    o.affectation,
    o.montant_usd,
    o.devise,
    o.libelle,
    o.adherent_id,
    o.paiement_id,
    o.cotisation_id
  FROM public.operations_financieres o
  WHERE public.can_view_finance(auth.uid())
    AND (_date_debut IS NULL OR o.created_at::date >= _date_debut)
    AND (_date_fin IS NULL OR o.created_at::date <= _date_fin)
  ORDER BY o.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.dg_flux_financier(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dg_flux_financier(date, date) TO authenticated;

COMMENT ON FUNCTION public.dg_flux_financier(date, date) IS
  'Flux financier détaillé du Directeur Général et des profils financiers autorisés. Lecture seule, filtrable par période, issu du grand livre immuable.';

CREATE OR REPLACE FUNCTION public.dg_synthese_financiere(
  _date_debut date DEFAULT NULL,
  _date_fin date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'date_debut', _date_debut,
    'date_fin', _date_fin,
    'entrees_usd', COALESCE(SUM(CASE WHEN o.sens = 'credit' THEN o.montant_usd ELSE 0 END), 0),
    'sorties_usd', COALESCE(SUM(CASE WHEN o.sens = 'debit' THEN o.montant_usd ELSE 0 END), 0),
    'solde_usd', COALESCE(SUM(CASE WHEN o.sens = 'credit' THEN o.montant_usd ELSE -o.montant_usd END), 0),
    'operations', COUNT(*)
  )
  FROM public.operations_financieres o
  WHERE public.can_view_finance(auth.uid())
    AND (_date_debut IS NULL OR o.created_at::date >= _date_debut)
    AND (_date_fin IS NULL OR o.created_at::date <= _date_fin);
$$;

REVOKE ALL ON FUNCTION public.dg_synthese_financiere(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dg_synthese_financiere(date, date) TO authenticated;

-- ---------------------------------------------------------------------
-- 9. TEMPS RÉEL : nouvelles boîtes métier.
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['membership_requests','gallery_images','site_settings','operations_financieres','factures_partenaires','partenaire_notifications'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------
-- 10. DOCUMENTATION
-- ---------------------------------------------------------------------
COMMENT ON TABLE public.membership_requests IS
  'Demandes publiques minimales. Lecture pour les responsables autorisés ; seule la fonction de coordination répond/modifie le dossier.';
COMMENT ON TABLE public.partenaires IS
  'Réseau Humanitas : hôpital, pharmacie, laboratoire, centre de bien-être ou entreprise. Chaque compte partenaire est cloisonné par partenaire_id et rôle compatible.';

-- ---------------------------------------------------------------------
-- 11. GED STORAGE PRIVÉ
-- ---------------------------------------------------------------------
-- Bucket dédié aux documents administratifs/financiers scannés.
-- Aucun document de GED n'est public.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents_humanitas',
  'documents_humanitas',
  false,
  10485760,
  ARRAY['application/pdf','image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS ged_storage_read ON storage.objects;
CREATE POLICY ged_storage_read
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents_humanitas'
  AND public.is_staff(auth.uid())
);

DROP POLICY IF EXISTS ged_storage_insert ON storage.objects;
CREATE POLICY ged_storage_insert
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents_humanitas'
  AND public.is_staff(auth.uid())
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS ged_storage_update ON storage.objects;
CREATE POLICY ged_storage_update
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents_humanitas'
  AND public.is_staff(auth.uid())
)
WITH CHECK (
  bucket_id = 'documents_humanitas'
  AND public.is_staff(auth.uid())
);

DROP POLICY IF EXISTS ged_storage_delete ON storage.objects;
CREATE POLICY ged_storage_delete
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documents_humanitas'
  AND public.is_staff(auth.uid())
);

-- ---------------------------------------------------------------------
-- 12. TYPOLOGIE GED ÉTENDUE AUX DOCUMENTS MÉTIER DEMANDÉS
-- ---------------------------------------------------------------------
ALTER TABLE public.ged_documents
  DROP CONSTRAINT IF EXISTS ged_documents_categorie_check;
ALTER TABLE public.ged_documents
  ADD CONSTRAINT ged_documents_categorie_check
  CHECK (categorie IN (
    'photo_adherent','photo_personnel','carte_imprimee',
    'fiche_adhesion','contrat','fiche_prise_en_charge',
    'piece_identite','ordonnance','facture','recu',
    'journal_caisse','justificatif_remboursement','liste_remboursements',
    'situation_financiere','depense','entree','justificatif'
  ));

-- ---------------------------------------------------------------------
-- 13. RÉSEAUX SOCIAUX : aucune URL d'exemple ne doit être publiée.
-- Les vraies URLs seront fournies et activées ultérieurement par Humanitas.
-- ---------------------------------------------------------------------
UPDATE public.cms_reseaux_sociaux
SET is_active = false,
    url = ''
WHERE is_active = true;

-- ---------------------------------------------------------------------
-- 14. PROPAGATION DU CLOISONNEMENT AUX SOUS-MODULES DE PEC
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Partenaire lit les decisions de ses pec" ON public.pec_decisions;
CREATE POLICY "Partenaire lit les decisions de ses pec"
ON public.pec_decisions
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.prises_en_charge p
  WHERE p.id = prise_en_charge_id
    AND public.partenaire_role_compatible(auth.uid(), p.partenaire_id)
));

DROP POLICY IF EXISTS "Partenaire lit ses prestations" ON public.pec_prestations;
CREATE POLICY "Partenaire lit ses prestations"
ON public.pec_prestations
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.prises_en_charge p
  WHERE p.id = prise_en_charge_id
    AND public.partenaire_role_compatible(auth.uid(), p.partenaire_id)
));

-- ---------------------------------------------------------------------
-- 15. NOTIFICATION MÉTIER : nouvelle demande d'adhésion
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notifier_demande_adhesion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.app_role;
BEGIN
  FOREACH r IN ARRAY ARRAY[
    'super_admin'::public.app_role,
    'directeur_general'::public.app_role,
    'coordonnateur'::public.app_role,
    'medecin_conseil'::public.app_role,
    'financier'::public.app_role,
    'agent_humanitas'::public.app_role
  ] LOOP
    INSERT INTO public.notifications_internes (
      destinataire_role, titre, message, niveau, entite, entite_id, lien
    ) VALUES (
      r,
      'Nouvelle demande d''adhésion',
      'Une nouvelle demande d''adhésion de ' || NEW.full_name || ' est disponible dans la boîte métier.',
      'info',
      'membership_request',
      NEW.id,
      '/portail/coordination'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_membership_request_notify ON public.membership_requests;
CREATE TRIGGER trg_membership_request_notify
AFTER INSERT ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.notifier_demande_adhesion();

REVOKE ALL ON FUNCTION public.notifier_demande_adhesion() FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.notifier_demande_adhesion() IS
  'Crée les notifications internes de nouvelle demande d''adhésion sans donner au public un accès d''écriture aux notifications.';

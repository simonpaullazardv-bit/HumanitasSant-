-- =====================================================================
-- HUMANITAS SANTÉ — audit final des routines, vues et appels applicatifs
-- Version 2026-08-12
--
-- Objectif : ne pas recréer les modules existants. Cette migration ferme
-- uniquement les incohérences découvertes lors de la revue des fonctions,
-- triggers, vues et RPC déjà utilisés par le frontend.
-- =====================================================================

-- 1. CONTEXTE DE COMPTE : une ligne déterministe par rôle/context métier.
-- Le rôle reste commun ; l'identifiant métier porte le cloisonnement.
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
      WHEN ur.role = 'hopital' AND pm.partenaire_id IS NOT NULL THEN 'hopital'
      WHEN ur.role = 'entreprise' AND pm.partenaire_id IS NOT NULL THEN 'entreprise'
      ELSE 'staff'
    END AS contexte,
    a.id AS adherent_id,
    b.id AS beneficiaire_id,
    pm.partenaire_id,
    COALESCE(b.code, a.matricule, p.numero) AS identifiant
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
      OR (ur.role IN ('hopital','entreprise') AND pm.partenaire_id IS NOT NULL)
    )
  ORDER BY CASE ur.role
    WHEN 'super_admin' THEN 1
    WHEN 'administrateur' THEN 2
    WHEN 'directeur_general' THEN 3
    WHEN 'coordonnateur' THEN 4
    WHEN 'medecin_conseil' THEN 5
    WHEN 'financier' THEN 6
    WHEN 'agent_humanitas' THEN 7
    WHEN 'entreprise' THEN 8
    WHEN 'hopital' THEN 9
    WHEN 'adherent' THEN 10
  END;
$$;

COMMENT ON FUNCTION public.mon_contexte_compte() IS
'Résout les contextes du compte connecté sans créer de rôle par personne. Un rôle commun est distingué par adherent_id, beneficiaire_id ou partenaire_id.';

REVOKE ALL ON FUNCTION public.mon_contexte_compte() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_contexte_compte() TO authenticated;

-- 2. DROITS FINANCIERS : le Directeur Général peut consulter les données
-- stratégiques, sans devenir administrateur technique.
CREATE OR REPLACE FUNCTION public.can_view_finance(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_finance(_user_id)
      OR public.is_directeur_general(_user_id);
$$;

COMMENT ON FUNCTION public.can_view_finance(uuid) IS
'Lecture des indicateurs financiers pour super_admin, administrateur, financier et directeur_general. Ne donne aucun droit de modification.';

REVOKE ALL ON FUNCTION public.can_view_finance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_finance(uuid) TO authenticated;

-- 3. ANCIEN RPC PARTENAIRE : conserver le contrat d'appel existant mais
-- déléguer au vérificateur canonique qui sait traiter adhérent ET bénéficiaire.
CREATE OR REPLACE FUNCTION public.partenaire_verifier_adherent(
  _partenaire_id uuid,
  _token uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.partenaire_verifier_code(_partenaire_id, NULL, _token);
$$;

COMMENT ON FUNCTION public.partenaire_verifier_adherent(uuid, uuid) IS
'Compatibilité conservée pour le frontend historique. Délègue à partenaire_verifier_code afin que le contrôle QR fonctionne pour adhérent et bénéficiaire.';

REVOKE ALL ON FUNCTION public.partenaire_verifier_adherent(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partenaire_verifier_adherent(uuid, uuid) TO authenticated;

-- 4. PRISE EN CHARGE : une carte fournie explicitement doit appartenir au
-- sujet et être active/non expirée. Cela complète le contrôle existant.
CREATE OR REPLACE FUNCTION public.check_pec_subject()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent uuid;
  v_statut public.statut_adherent;
  v_card uuid;
  v_card_adherent uuid;
  v_card_beneficiaire uuid;
BEGIN
  IF NEW.adherent_id IS NULL AND NEW.beneficiaire_id IS NULL THEN
    RAISE EXCEPTION 'Une prise en charge doit être rattachée à un adhérent ou un bénéficiaire.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.beneficiaire_id IS NOT NULL THEN
    SELECT b.adherent_id, a.statut
      INTO v_parent, v_statut
    FROM public.beneficiaires b
    JOIN public.adherents a ON a.id = b.adherent_id
    WHERE b.id = NEW.beneficiaire_id AND b.is_active = true;

    IF v_parent IS NULL THEN
      RAISE EXCEPTION 'Bénéficiaire introuvable ou inactif.' USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.adherent_id IS NULL THEN
      NEW.adherent_id := v_parent;
    ELSIF NEW.adherent_id <> v_parent THEN
      RAISE EXCEPTION 'Le bénéficiaire ne correspond pas à l''adhérent fourni.' USING ERRCODE = 'check_violation';
    END IF;

    IF v_statut <> 'actif' THEN
      RAISE EXCEPTION 'La couverture de l''adhérent titulaire n''est pas active.' USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.carte_id IS NOT NULL THEN
      SELECT cm.id, cm.adherent_id, cm.beneficiaire_id
        INTO v_card, v_card_adherent, v_card_beneficiaire
      FROM public.cartes_membre cm
      WHERE cm.id = NEW.carte_id
        AND cm.statut = 'active'
        AND (cm.date_expiration IS NULL OR cm.date_expiration >= current_date);
      IF v_card IS NULL OR v_card_beneficiaire <> NEW.beneficiaire_id THEN
        RAISE EXCEPTION 'La carte indiquée ne correspond pas au bénéficiaire ou n''est plus valide.'
          USING ERRCODE = 'check_violation';
      END IF;
    ELSE
      SELECT cm.id INTO v_card
      FROM public.cartes_membre cm
      WHERE cm.beneficiaire_id = NEW.beneficiaire_id
        AND cm.statut = 'active'
        AND (cm.date_expiration IS NULL OR cm.date_expiration >= current_date)
      ORDER BY cm.date_emission DESC
      LIMIT 1;
      IF v_card IS NULL THEN
        RAISE EXCEPTION 'Le bénéficiaire ne possède pas de carte active valide.' USING ERRCODE = 'check_violation';
      END IF;
      NEW.carte_id := v_card;
    END IF;
  ELSE
    SELECT a.statut INTO v_statut
    FROM public.adherents a
    WHERE a.id = NEW.adherent_id;

    IF v_statut <> 'actif' THEN
      RAISE EXCEPTION 'La couverture de l''adhérent n''est pas active.' USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.carte_id IS NOT NULL THEN
      SELECT cm.id, cm.adherent_id, cm.beneficiaire_id
        INTO v_card, v_card_adherent, v_card_beneficiaire
      FROM public.cartes_membre cm
      WHERE cm.id = NEW.carte_id
        AND cm.statut = 'active'
        AND (cm.date_expiration IS NULL OR cm.date_expiration >= current_date);
      IF v_card IS NULL OR v_card_adherent <> NEW.adherent_id OR v_card_beneficiaire IS NOT NULL THEN
        RAISE EXCEPTION 'La carte indiquée ne correspond pas à l''adhérent ou n''est plus valide.'
          USING ERRCODE = 'check_violation';
      END IF;
    ELSE
      SELECT cm.id INTO v_card
      FROM public.cartes_membre cm
      WHERE cm.adherent_id = NEW.adherent_id
        AND cm.statut = 'active'
        AND (cm.date_expiration IS NULL OR cm.date_expiration >= current_date)
      ORDER BY cm.date_emission DESC
      LIMIT 1;
      NEW.carte_id := v_card;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pec_subject ON public.prises_en_charge;
CREATE TRIGGER trg_pec_subject
BEFORE INSERT OR UPDATE ON public.prises_en_charge
FOR EACH ROW EXECUTE FUNCTION public.check_pec_subject();

COMMENT ON FUNCTION public.check_pec_subject() IS
'Contrôle transactionnel du sujet de PEC : adhérent ou bénéficiaire, parenté, couverture active et carte cohérente.';

REVOKE ALL ON FUNCTION public.check_pec_subject() FROM PUBLIC, anon, authenticated;

-- 5. ROUTINES AUTOMATIQUES DE RETARD : elles modifient des données
-- financières. Aucun appel direct par un utilisateur standard n'est permis.
CREATE OR REPLACE FUNCTION public.traiter_retards()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record; n integer := 0;
BEGIN
  IF NOT public.can_manage_finance(auth.uid()) THEN
    RAISE EXCEPTION 'Routine réservée à la gestion financière.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  FOR r IN
    SELECT c.* FROM public.cotisations c
    WHERE c.echeance < current_date
      AND c.statut IN ('due','partielle')
  LOOP
    UPDATE public.cotisations SET statut = 'en_retard' WHERE id = r.id;
    INSERT INTO public.alertes_financieres (adherent_id, cotisation_id, type, niveau, message)
    VALUES (r.adherent_id, r.id, 'cotisation_en_retard', 'critique',
      'Cotisation de ' || to_char(r.periode, 'MM/YYYY') || ' impayée après échéance.')
    ON CONFLICT DO NOTHING;
    PERFORM public.recalculer_solde(r.adherent_id);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.traiter_retards() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.traiter_retards() TO authenticated;

CREATE OR REPLACE FUNCTION public.traiter_retards_cotisations_mensuelles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_penalites numeric(12,2) := 0.00;
  r record;
  v_mois date := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  IF NOT public.can_manage_finance(auth.uid()) THEN
    RAISE EXCEPTION 'Routine réservée à la gestion financière.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Conserve la règle métier historique : contrôle à partir du 5 du mois.
  IF EXTRACT(DAY FROM CURRENT_DATE) >= 5 THEN
    FOR r IN
      SELECT a.id, a.nom, a.prenom, a.categorie_id, c.prix_usd AS cotisation_mensuelle_usd
      FROM public.adherents a
      JOIN public.categories_adhesion c ON c.id = a.categorie_id
      WHERE a.statut = 'actif'
        AND NOT EXISTS (
          SELECT 1 FROM public.cotisations cot
          WHERE cot.adherent_id = a.id
            AND cot.periode = v_mois
            AND cot.statut = 'payee'
        )
    LOOP
      -- Le retard de paiement appartient au cycle de cotisation, pas au statut d'adhésion.
      -- Ne pas écrire une valeur absente de l'enum statut_adherent.

      INSERT INTO public.notifications_internes (
        destinataire_role, titre, message, entite, entite_id, lien
      ) VALUES (
        'financier',
        'Cotisation en retard - ' || r.nom || ' ' || r.prenom,
        'L''échéance du 5/Mois est dépassée pour la période ' || TO_CHAR(v_mois, 'YYYY-MM') || '. Montant dû : ' || r.cotisation_mensuelle_usd || ' USD.',
        'adherent', r.id, '/portail/cotisations'
      );

      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('adherents_en_retard', v_count, 'periode', TO_CHAR(v_mois, 'YYYY-MM'));
END;
$$;

REVOKE ALL ON FUNCTION public.traiter_retards_cotisations_mensuelles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.traiter_retards_cotisations_mensuelles() TO authenticated;


-- 6. VUES COMPTABLES : ne plus exposer le grand livre à tout utilisateur
-- authentifié. Le frontend financier passe désormais par des RPC contrôlés.
CREATE OR REPLACE FUNCTION public.get_journal_caisse()
RETURNS SETOF public.v_journal_caisse
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.v_journal_caisse
  WHERE public.can_view_finance(auth.uid())
  ORDER BY date_operation DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_grand_livre()
RETURNS SETOF public.v_grand_livre
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.v_grand_livre
  WHERE public.can_view_finance(auth.uid())
  ORDER BY date_écriture ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_balance_comptable()
RETURNS SETOF public.v_balance_comptable
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.v_balance_comptable
  WHERE public.can_view_finance(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_journal_caisse() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_grand_livre() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_balance_comptable() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_journal_caisse() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_grand_livre() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_balance_comptable() TO authenticated;

COMMENT ON FUNCTION public.get_journal_caisse() IS 'RPC de lecture contrôlée du journal de caisse pour finance, administration et direction générale.';
COMMENT ON FUNCTION public.get_grand_livre() IS 'RPC de lecture contrôlée du grand livre pour finance, administration et direction générale.';
COMMENT ON FUNCTION public.get_balance_comptable() IS 'RPC de lecture contrôlée de la balance comptable pour finance, administration et direction générale.';

-- 7. Les anciennes vues restent compatibles avec le schéma, mais ne sont
-- plus directement exposées au rôle authenticated. Le frontend V3 utilise
-- les RPC ci-dessus.
REVOKE ALL ON public.v_journal_caisse FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_grand_livre FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_balance_comptable FROM PUBLIC, anon, authenticated;

-- 8. Appels RPC utilisés par le frontend : aucun droit public/anon par défaut.
-- Les fonctions publiques de vérification restent explicitement traitées
-- ailleurs (verifier_carte est la seule vérification publique par token).
REVOKE ALL ON FUNCTION public.carte_conditions(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.emettre_carte(uuid, uuid, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.emettre_carte_beneficiaire(uuid, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.facture_controler(uuid, text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.lier_mon_compte_beneficiaire(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ordre_payer(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ordre_valider(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.partenaire_verifier_code(uuid, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pec_decider(uuid, text, text, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pec_enregistrer_prestations(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.plafond_disponible(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.traiter_retards() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.traiter_retards_cotisations_mensuelles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verifier_carte(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verifier_carte(uuid) TO anon, authenticated;

COMMENT ON SCHEMA public IS 'HUMANITAS : fonctions métier, triggers, vues et RPC doivent être appelés par les chemins applicatifs documentés. Les routines financières sensibles sont protégées par contrôle de rôle.';

-- 9. Helpers de politiques : exécution authentifiée uniquement.
REVOKE ALL ON FUNCTION public.can_manage_cms(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_cms(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_directeur_general(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_directeur_general(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.can_view_strategic_data(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_strategic_data(uuid) TO authenticated;

-- 10. Vérifications métier sensibles : pas de fuite publique des droits.
REVOKE ALL ON FUNCTION public.carte_est_payee(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.carte_est_payee(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.verifier_droits_soins(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verifier_droits_soins(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.peut_imprimer_carte(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.peut_imprimer_carte(uuid) TO authenticated;

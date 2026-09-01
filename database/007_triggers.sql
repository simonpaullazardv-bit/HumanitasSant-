-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 007_triggers.sql (Déclencheurs Triggers)
-- ============================================================================

-- 1. Fonction Trigger générique de mise à jour du champ updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Attachement du trigger aux tables principales
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_adherents_updated_at
    BEFORE UPDATE ON public.adherents
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_cotisations_updated_at
    BEFORE UPDATE ON public.cotisations
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_remboursements_updated_at
    BEFORE UPDATE ON public.demandes_remboursement
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 2. Trigger de synchronisation automatique lors de l'inscription via Supabase Auth
CREATE OR REPLACE FUNCTION public.fn_on_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nom, prenom, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nom', 'Nom'),
        COALESCE(NEW.raw_user_meta_data->>'prenom', 'Prénom'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'adherent')
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_on_auth_user_created();

-- 3. Trigger pour générer automatiquement la carte santé lors de l'activation d'un adhérent
CREATE OR REPLACE FUNCTION public.fn_auto_generate_carte_sante()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_num_carte VARCHAR(50);
BEGIN
    IF (NEW.statut = 'actif' AND (OLD.statut IS NULL OR OLD.statut != 'actif')) THEN
        v_num_carte := 'CARD-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6);
        
        IF NOT EXISTS (SELECT 1 FROM public.cartes_sante WHERE adherent_id = NEW.id) THEN
            INSERT INTO public.cartes_sante (
                adherent_id, numero_carte, date_emission, date_expiration, code_securite_hash
            ) VALUES (
                NEW.id,
                v_num_carte,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '1 year',
                encode(digest(v_num_carte || NEW.id::TEXT, 'sha256'), 'hex')
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_adherent_activation_carte
    AFTER UPDATE ON public.adherents
    FOR EACH ROW EXECUTE FUNCTION public.fn_auto_generate_carte_sante();

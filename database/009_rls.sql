-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 009_rls.sql (Politiques de Sécurité Row Level Security)
-- ============================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adherents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayants_droit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes_remboursement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartes_sante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclamations ENABLE ROW LEVEL SECURITY;

-- 1. Politiques pour `profiles`
CREATE POLICY "Les utilisateurs lisent leur propre profil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs mettent a jour leur propre profil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Les administrateurs ont acces total aux profils" 
ON public.profiles FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('gestionnaire', 'admin')
    )
);

-- 2. Politiques pour `adherents`
CREATE POLICY "Les adherents consultent leur propre dossier" 
ON public.adherents FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Les gestionnaires consultent tous les adherents" 
ON public.adherents FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('gestionnaire', 'admin')
    )
);

-- 3. Politiques pour `partenaires` (Public en lecture)
CREATE POLICY "Tout le monde peut consulter l annuaire des partenaires" 
ON public.partenaires FOR SELECT 
TO authenticated, anon
USING (est_conventionne = TRUE);

-- 4. Politiques pour `cotisations`
CREATE POLICY "Les adherents consultent leurs propres cotisations" 
ON public.cotisations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.adherents 
        WHERE adherents.id = cotisations.adherent_id AND adherents.user_id = auth.uid()
    )
);

-- 5. Politiques pour `demandes_remboursement`
CREATE POLICY "Les adherents consultent et creent leurs demandes" 
ON public.demandes_remboursement FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.adherents 
        WHERE adherents.id = demandes_remboursement.adherent_id AND adherents.user_id = auth.uid()
    )
);

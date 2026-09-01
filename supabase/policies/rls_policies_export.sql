-- Supabase Row Level Security Policies Export
-- Ce fichier contient le résumé des politiques RLS appliquées à la base Supabase

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adherents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes_remboursement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs consultent leur profil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Adherents consultent leur dossier" ON public.adherents FOR SELECT USING (user_id = auth.uid());

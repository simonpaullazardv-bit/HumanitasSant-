-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 001_tables.sql (Définition des Tables et Types)
-- ============================================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enumérations
CREATE TYPE user_role AS ENUM ('adherent', 'prestataire', 'gestionnaire', 'admin');
CREATE TYPE statut_adhesion AS ENUM ('en_attente', 'actif', 'suspendu', 'resilie');
CREATE TYPE formule_sante AS ENUM ('essential', 'confort', 'serenite', 'excellence');
CREATE TYPE type_prestation AS ENUM ('consultation', 'pharmacie', 'hospitalisation', 'maternite', 'dentaire', 'optique', 'analyse_labo', 'bien_etre');
CREATE TYPE statut_demande AS ENUM ('soumis', 'en_traitement', 'approuve', 'rejete', 'paye');
CREATE TYPE statut_cotisation AS ENUM ('en_attente', 'paye', 'retard', 'echeance_depassee');
CREATE TYPE mode_paiement AS ENUM ('carte_bancaire', 'virement', 'mobile_money', 'prelevement');

-- 1. Table des Profils Utilisateurs (Liée à Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(20),
    pays VARCHAR(100) DEFAULT 'Côte d''Ivoire',
    role user_role DEFAULT 'adherent',
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Adhérents (Informations Médicales et d'Adhésion)
CREATE TABLE IF NOT EXISTS public.adherents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    numero_adherent VARCHAR(50) NOT NULL UNIQUE,
    formule formule_sante DEFAULT 'confort',
    statut statut_adhesion DEFAULT 'en_attente',
    date_naissance DATE NOT NULL,
    genre VARCHAR(10),
    groupe_sanguin VARCHAR(5),
    personne_contact_nom VARCHAR(100),
    personne_contact_telephone VARCHAR(20),
    date_debut_adhesion DATE DEFAULT CURRENT_DATE,
    date_fin_adhesion DATE,
    qr_code_token TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Ayants Droit (Famille de l'adhérent)
CREATE TABLE IF NOT EXISTS public.ayants_droit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adherent_id UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    lien_parente VARCHAR(50) NOT NULL, -- Epoux, Enfant, Parent
    date_naissance DATE NOT NULL,
    carte_numero VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des Partenaires & Prestataires de Santé
CREATE TABLE IF NOT EXISTS public.partenaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_etablissement VARCHAR(255) NOT NULL,
    type_etablissement VARCHAR(100) NOT NULL, -- Hôpital, Clinique, Pharmacie, Laboratoire, Centre Bien-être
    registre_commerce VARCHAR(100),
    adresse TEXT NOT NULL,
    ville VARCHAR(100) NOT NULL,
    telephone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    taux_conventionne NUMERIC(5,2) DEFAULT 100.00, -- Taux de tiers payant pris en charge
    est_conventionne BOOLEAN DEFAULT TRUE,
    note_qualite NUMERIC(3,2) DEFAULT 4.80,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des Cotisations (Facturation Mensuelle/Annuelle)
CREATE TABLE IF NOT EXISTS public.cotisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adherent_id UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
    reference_facture VARCHAR(100) NOT NULL UNIQUE,
    periode VARCHAR(20) NOT NULL, -- Ex: 2026-08
    montant NUMERIC(12,2) NOT NULL,
    date_echeance DATE NOT NULL,
    date_paiement TIMESTAMPTZ,
    statut statut_cotisation DEFAULT 'en_attente',
    methode_paiement mode_paiement,
    recu_pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table des demandes de Remboursement & Tiers Payant
CREATE TABLE IF NOT EXISTS public.demandes_remboursement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adherent_id UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
    partenaire_id UUID REFERENCES public.partenaires(id) ON DELETE SET NULL,
    numero_dossier VARCHAR(100) NOT NULL UNIQUE,
    type_prestation type_prestation NOT NULL,
    montant_facture NUMERIC(12,2) NOT NULL,
    montant_couvert NUMERIC(12,2) NOT NULL,
    montant_reste_charge NUMERIC(12,2) NOT NULL,
    statut statut_demande DEFAULT 'soumis',
    date_soin DATE NOT NULL,
    ordonnance_url TEXT,
    facture_url TEXT,
    commentaire_medical TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Table des Cartes Visuelles Numériques
CREATE TABLE IF NOT EXISTS public.cartes_sante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adherent_id UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
    numero_carte VARCHAR(50) NOT NULL UNIQUE,
    date_emission DATE DEFAULT CURRENT_DATE,
    date_expiration DATE NOT NULL,
    est_active BOOLEAN DEFAULT TRUE,
    code_securite_hash VARCHAR(255) NOT NULL,
    qr_code_svg TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Table des Rendez-vous & Prise de Contact
CREATE TABLE IF NOT EXISTS public.rendez_vous (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adherent_id UUID NOT NULL REFERENCES public.adherents(id) ON DELETE CASCADE,
    partenaire_id UUID REFERENCES public.partenaires(id) ON DELETE SET NULL,
    motive TEXT NOT NULL,
    date_heure TIMESTAMPTZ NOT NULL,
    statut VARCHAR(50) DEFAULT 'programme', -- programme, confirme, annule, termine
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Table des Réclamations & Support Client
CREATE TABLE IF NOT EXISTS public.reclamations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sujet VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priorite VARCHAR(20) DEFAULT 'moyenne', -- basse, moyenne, haute, urgente
    statut VARCHAR(50) DEFAULT 'ouverte', -- ouverte, en_cours, resolue, fermee
    reponse_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Table des Journaux d'Audit (Sécurité et Traçabilité)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entite_concernee VARCHAR(100) NOT NULL,
    entite_id UUID,
    details JSONB,
    adresse_ip VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

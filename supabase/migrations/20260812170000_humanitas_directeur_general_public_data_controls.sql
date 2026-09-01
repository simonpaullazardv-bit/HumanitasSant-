-- HUMANITAS — Ajout du rôle métier Directeur Général
-- Migration volontairement isolée : PostgreSQL doit valider la nouvelle valeur ENUM
-- avant que les fonctions suivantes puissent la référencer.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'directeur_general';

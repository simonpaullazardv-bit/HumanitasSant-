-- HUMANITAS V5.2: extension additive du catalogue des réseaux sociaux.
-- Aucun compte n'est créé ici : les URL officielles restent à confirmer.
ALTER TYPE public.reseau_social ADD VALUE IF NOT EXISTS 'messenger';
ALTER TYPE public.reseau_social ADD VALUE IF NOT EXISTS 'truth_social';
ALTER TYPE public.reseau_social ADD VALUE IF NOT EXISTS 'threads';

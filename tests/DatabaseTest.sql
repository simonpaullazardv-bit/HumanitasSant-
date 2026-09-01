-- Tests de validation pour la base de données PostgreSQL / Humanitas Santé

-- 1. Test de génération de numéro d'adhérent
SELECT public.fn_generate_numero_adherent();

-- 2. Test du calcul de taux de couverture
SELECT public.fn_calculer_taux_couverture('excellence', 'hospitalisation') AS taux_attendu_100;
SELECT public.fn_calculer_taux_couverture('essential', 'consultation') AS taux_attendu_70;

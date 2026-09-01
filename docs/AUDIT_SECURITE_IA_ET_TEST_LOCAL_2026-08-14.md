# Audit sécurité IA et préparation test local — 2026-08-14

## Lovable / Google AI Studio / Gemini
- Ces outils ne sont pas, en eux-mêmes, un danger pour le site.
- Le risque vient des dépendances et services encore appelés au runtime.
- Lovable reste utilisé par l’authentification OAuth et la configuration Vite/TanStack dans cette version ; il ne faut donc pas le supprimer brutalement avant migration complète vers Supabase Auth.
- Google AI Studio / Gemini n’est pas une dépendance runtime identifiée dans le code applicatif principal ; les anciennes mentions sont documentaires/historiques.
- Ne jamais placer une clé Gemini, une clé service_role Supabase ou un secret OAuth dans `public/` ou dans le frontend.

## Compte local
Email : `superadmin@humanitassante.org`
Mot de passe : `HumanitasLocal#2026!`

Ce compte est créé uniquement par `supabase/seed.sql` après `supabase db reset`. Il ne doit pas être utilisé comme compte de production.

## Données de test locales
- 4 catégories : Bronze, Argent, Or, Platine.
- 5 partenaires de démonstration, dont Lumen Pacis Humanitas, Rapido et ASBL Mon Ami.
- Les deux derniers établissements sanitaires sont explicitement fictifs et destinés aux tests.

## Important
`database/010_seed.sql` reste historique et n’est pas exécuté avec les migrations actuelles. Le nouveau seed local est `supabase/seed.sql`.

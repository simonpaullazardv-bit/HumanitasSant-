# Backend PHP — archive technique

Ce dossier provient de l'ancienne génération du projet et reste conservé pour référence.

## Statut

- **Non utilisé par le build TanStack Start/Vite actuel.**
- **Non requis pour la connexion à Supabase.**
- Les fichiers PHP ont été contrôlés avec `php -l` lors de l'audit du 14 août 2026 : aucune erreur de syntaxe détectée.
- Ne pas déployer ce dossier comme API publique en parallèle du backend Supabase sans décision d'architecture explicite.

## Backend actif de la version actuelle

Le flux applicatif principal utilise :

`React/TanStack Start → Server Functions → Supabase/PostgreSQL + RLS`

Les données sensibles et les opérations métier restent protégées par Supabase Auth, les fonctions SQL/RPC et les policies RLS.

## Pourquoi le PHP reste présent ?

Il est conservé pour ne pas perdre le travail historique (contrôleurs, modèles, services PDF, middleware). Sa présence dans le ZIP ne signifie pas qu'il doit être lancé en production.

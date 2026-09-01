# Procédure Supabase — Humanitas

## Avant de commencer

**Ne pas exécuter le dossier `database/` historique.**

Utiliser uniquement les migrations de `supabase/migrations/` dans l'ordre chronologique.

## Staging obligatoire

Avant toute production :

1. créer un projet Supabase de test/staging ;
2. configurer les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` ;
3. appliquer les migrations ;
4. vérifier que toutes les tables, fonctions, vues et policies sont présentes ;
5. régénérer les types TypeScript ;
6. lancer les tests ;
7. seulement après validation, reproduire en production.

## Migrations actuelles

Les deux dernières migrations sont notamment :

```text
20260811100000_comptabilite_cotisations_remboursements_cartes.sql
20260811110000_modules_partenaires_rh_securite_systeme.sql
20260812133000_humanitas_front_public_and_security_fix.sql
```

La dernière migration ajoute les tables nécessaires aux formulaires publics, à la galerie et aux paramètres publics, et renforce les RLS des modules RH/sécurité.

## Régénération des types

Après application sur staging, régénérer `src/integrations/supabase/types.ts` depuis le schéma réel. Le fichier fourni dans le dépôt est volontairement considéré comme un artefact à régénérer : il correspondait à une version antérieure du schéma.

## Important

Le dépôt ne contient aucune clé Supabase réelle. Les secrets doivent rester dans `.env`/Secrets et ne doivent jamais être ajoutés au ZIP source.

# Humanitas Santé & Centre de Bien-Être

Bienvenue dans le dépôt officiel de l'application **Humanitas Santé**, solution globale de gestion mutuelle, couverture santé et réseau de soins publiés et validés.

---

## 📁 Architecture du Projet

Le projet est strictement organisé selon les standards professionnels multi-tiers, isolant chaque technologie dans son domaine dédié :

```
/HumanitasSante
├── /database               # Ancienne génération SQL conservée pour historique
│   ├── 001_tables.sql       # Schémas des tables et énumérations
│   ├── 002_constraints.sql  # Contraintes de validation métier
│   ├── 003_indexes.sql      # Indexation de performance B-Tree/GIN
│   ├── 004_foreign_keys.sql # Clés étrangères & règles d'intégrité
│   ├── 005_functions.sql    # Fonctions PL/pgSQL
│   ├── 006_procedures.sql   # Procédures stockées batch
│   ├── 007_triggers.sql     # Déclencheurs & synchronisation Auth
│   ├── 008_views.sql        # Vues analytiques & reporting
│   ├── 009_rls.sql          # Politiques de sécurité Row Level Security
│   └── 010_seed.sql         # Données de démonstration
│
├── /backend                # Legacy PHP conservé hors du flux applicatif principal
│   ├── /api                 # Gateway & Point d'entrée unique
│   ├── /controllers         # Contrôleurs de gestion des requêtes
│   ├── /models              # Modèles de données Supabase
│   ├── /middleware          # Middleware CORS et JWT Auth
│   ├── /routes              # Définition des routes de l'API
│   ├── /helpers             # Utilitaires de réponse et validation
│   ├── /services            # Services d'intégration & PDF
│   └── /uploads             # Stockage temporaire des fichiers
│
├── /frontend               # Ancienne organisation frontend conservée
│   ├── /pages               # Pages applicatives
│   ├── /components          # Composants UI réutilisables
│   ├── /layouts             # Mises en page globales
│   ├── /assets              # Pictogrammes & Logos
│   ├── /css                 # Styles CSS
│   ├── /js                  # Fichiers JavaScript
│   └── /images              # Médias & Illustrations
│
├── /supabase               # Configuration Cloud & Edge
│   ├── migrations           # Historique des migrations
│   ├── storage              # Buckets pour ordonnances & factures
│   ├── edge-functions       # Edge Functions Deno
│   ├── auth                 # Modèles d'emails d'authentification
│   ├── policies             # Déclarations des politiques RLS
│   └── config               # Configuration local & cloud Supabase
│
├── /docs                   # Documentation technique & fonctionnelle
│   ├── Architecture.md      # Architecture système
│   ├── ReglesMetier.md      # Barèmes & garanties santé
│   ├── BaseDonnees.md       # Dictionnaire des données
│   └── API.md               # Spécifications OpenAPI
│
├── /tests                  # Tests unitaires & E2E
└── README.md               # Guide d'utilisation du projet
```

---

## 🚀 Démarrage Rapide

### 1. Base de Données PostgreSQL / Supabase

> **Important :** le dossier `/database` est une ancienne génération conservée pour historique.
> Il ne faut pas exécuter `001_tables.sql` à `010_seed.sql` avec les migrations actuelles.

La source de vérité est `/supabase/migrations`. Utilisez un projet Supabase de **staging** et appliquez les migrations dans l'ordre chronologique.

Voir [`docs/PROCEDURE_SUPABASE.md`](docs/PROCEDURE_SUPABASE.md) pour la procédure complète.

### 2. Frontend React

Cette version utilise TanStack Start/React avec Supabase. PHP n'est pas utilisé comme passerelle applicative principale : le dossier `/backend` est conservé en archive technique et a été vérifié syntaxiquement, mais il ne participe pas au build Vite/TanStack.

Les médias publics sont hybrides : `public/img/**` et `public/videos/**` sont indexés automatiquement avant `dev` et `build`. Supabase enrichit ensuite la vitrine lorsqu'il fournit des contenus publiés.

Lancez le serveur de développement :
```bash
npm run dev
```

---

## 🧭 Architecture cible

Le rôle utilisateur est commun à plusieurs comptes métier : `adherent + adherent_id`, `adherent + beneficiaire_id`, `hopital + partenaire_id`, `entreprise + partenaire_id`. Les données sont cloisonnées par PostgreSQL/RLS et les dashboards utilisent Supabase Realtime.

Voir `docs/ARCHITECTURE_CIBLE_SANS_PHP.md` et `docs/DASHBOARDS_METIER_2026-08-12.md`.

## 🛡️ Sécurité & Conformité
- **PostgreSQL RLS** : Protection des données nominatives de santé (`auth.uid()`).
- **Isolation des Rôles** : Adhérent, Prestataire, Gestionnaire, Administrateur.
- **Tiers Payant** : affichage et prise en charge selon les droits ouverts et les partenaires effectivement publiés/validés dans Supabase.

---
© 2026 Humanitas Santé & Centre de Bien-Être. Tous droits réservés.


## Version supérieure 2026-08-12

Une migration additive `20260812210000_humanitas_version_superieure_metier.sql` consolide les espaces partenaires distincts, le cloisonnement par rôle + `partenaire_id`, la vérification QR/code, les demandes d’adhésion, le flux financier DG, la géolocalisation, la GED privée et les notifications métier. Voir `docs/VERSION_SUPERIEURE_2026-08-12.md`.

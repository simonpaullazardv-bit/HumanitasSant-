# Architecture technique — Humanitas Santé

## 1. Architecture cible décidée

Cette version ne dépend pas de PHP comme passerelle applicative.

```text
┌──────────────────────────────────────────────┐
│             FRONTEND REACT / TANSTACK        │
│ pages publiques + portail + dashboards       │
└──────────────────────┬───────────────────────┘
                       │ Supabase JS
                       ▼
┌──────────────────────────────────────────────┐
│                 SUPABASE                     │
│ Auth + PostgreSQL + RLS + Realtime + Storage │
│ + Edge Functions pour les traitements serveur│
└──────────────────────────────────────────────┘
```

Le dossier `/backend` est conservé comme **legacy de la génération Gemini précédente**. Il n'est pas utilisé par le flux principal de cette version.

## 2. Identité métier

Le rôle est un code commun. L'identifiant métier fait le cloisonnement :

- `adherent` + `adherent_id` pour l'adhérent ;
- `adherent` + `beneficiaire_id` pour le bénéficiaire ;
- `hopital` + `partenaire_id` pour l'établissement ;
- `entreprise` + `partenaire_id` pour l'entreprise ;
- rôles internes + `user_id`/`personnel_id` pour le staff.

Il n'existe pas de rôle applicatif séparé `beneficiaire`.

## 3. Base de données

La source de vérité est `supabase/migrations/`.

Le dossier `/database` correspond à une ancienne génération et est conservé pour comparaison. Il ne doit pas être exécuté parallèlement aux migrations Supabase.

## 4. Sécurité

- Supabase Auth ;
- `user_roles` ;
- fonctions SQL d'autorisation ;
- RLS ;
- contrôle serveur des prises en charge ;
- Storage policies ;
- audit ;
- fonctions `SECURITY DEFINER` uniquement lorsqu'elles sont nécessaires.

## 5. Temps réel

Les principales tables métier sont activées dans `supabase_realtime`. Les dashboards réagissent aux changements PostgreSQL sans imposer un rechargement manuel.

## 6. Tableaux de bord

Les 8 espaces historiques restent :

1. Administration ;
2. Coordination ;
3. Médecine conseil ;
4. Finance ;
5. Agent Humanitas ;
6. Entreprise ;
7. Hôpital ;
8. Adhérent.

Le modèle ajoute un **espace bénéficiaire distinct dans l'interface**, tout en conservant le même rôle applicatif `adherent`.

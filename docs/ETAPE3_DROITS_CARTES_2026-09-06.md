# Étape 3 — Droits, cartes et impressions

Base : Étape 2 cumulative.

## Règles appliquées

- DG : émission, réimpression et impression des cartes.
- Finance : émission, réimpression et impression des cartes.
- Coordination : émission, réimpression et impression des cartes.
- Agent terrain : enregistrement des adhérents, mais aucune gestion ni impression de carte.
- Super administrateur / Administrateur : gestion complète.
- Cartes du personnel : gestion réservée à la Direction et à l’Administration.

## Sécurité

Les droits sont appliqués à deux niveaux :

1. interface via `AccessGuard` et désactivation des actions non autorisées ;
2. base Supabase via une migration RLS sur `cartes_membre`.

La prochaine étape devra tester ces droits avec des comptes réels avant la validation globale.

# HUMANITAS V5.1 — Audit final et harmonisation DBA

## Statut
Version préparée à partir de `HUMANITAS-WELLNESS-HUB-FINAL-2026-08-12-V5.1-DBA-HARMONISEE(1).zip`.

## Corrections bloquantes
1. `categories_adhesion` ne possédait pas `cotisation_mensuelle_usd`, `plafond_annuel_usd` ni `taux_couverture_pct`. Les migrations financières ont été harmonisées avec les colonnes réelles : `prix_usd`, `plafond_usd`, `taux_couverture`.
2. La routine de retard utilisait `adherents.statut = 'en_retard'`, alors que `statut_adherent` ne contient pas cette valeur. Le retard est désormais porté par `cotisations.statut = 'en_retard'`.
3. La routine comparait `cotisations.periode` (DATE) à une chaîne `YYYY-MM`. La période de contrôle est désormais le premier jour du mois (`DATE`).
4. Le catalogue métier est harmonisé sur Bronze / Argent / Or / Platine. L'ancien niveau `diamant`, introduit par une migration historique, est conservé pour compatibilité des données mais désactivé.

## Entreprises / partenaires
- Aucune table `entreprise` supplémentaire n'est créée.
- `partenaires` reste le référentiel unique des structures.
- Une entreprise est `partenaires.type = 'entreprise'`.
- `adherents.entreprise_id` référence `partenaires.id` et un trigger empêche de rattacher un adhérent à un partenaire qui n'est pas de type `entreprise`.
- Aucun `membre_couvert` ni `carte_membre_couvert` n'est créé.
- Un membre couvert est un adhérent avec `adherents.entreprise_id` renseigné.

## partenaire_membres
La table est conservée car elle sert au rattachement technique des comptes utilisateurs aux partenaires et aux règles RLS. Elle n'est pas la table des membres couverts.

## Sécurité / QR / token
Les structures existantes de cartes et `qr_token` sont conservées. Aucune suppression destructive n'a été introduite.

## Méthode de déploiement
Après extraction de cette archive dans un nouveau dossier de travail :

```powershell
npx supabase link --project-ref urlyhjvlmqsetwrualbp
npx supabase migration list
npx supabase db push --dry-run
```

Ne lancer le vrai `db push` qu'après validation du dry-run.

## Important
Les migrations historiques n'ont pas été supprimées. Les corrections nécessaires à l'exécution ont été appliquées directement aux migrations qui contenaient les références invalides, car une migration corrective placée après une migration qui échoue ne peut pas réparer cette migration en amont.

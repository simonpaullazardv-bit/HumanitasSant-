# CORRECTION FINALE V5.1 — 2026-08-13

## Correction appliquée

Cette archive corrige deux problèmes constatés lors de la validation Supabase :

1. L'archive précédente contenait le projet sous un sous-dossier `humanitas_review/`.
   Le projet est maintenant directement à la racine de l'archive. Après extraction,
   le dossier courant contient bien `supabase/`, `src/`, `package.json`, etc.

2. La migration `20260811100000_comptabilite_cotisations_remboursements_cartes.sql`
   créait la vue `public.v_journal_caisse` avec `o.partenaire_id`, alors que
   `public.operations_financieres` ne possédait pas encore cette colonne.

   La migration ajoute maintenant :
   - `operations_financieres.partenaire_id uuid`
   - FK vers `public.partenaires(id)` avec `ON DELETE SET NULL`
   - index `idx_operations_partenaire`

Cette correction respecte l'architecture métier retenue :
`partenaires` est l'entité unique, et son champ `type` porte les valeurs
`hopital`, `pharmacie`, `laboratoire`, `centre_bien_etre`, `entreprise`.

Aucune table `entreprise` supplémentaire, aucune table `membre_couvert` et
aucune table `carte_membre_couvert` n'a été ajoutée.

## Important

Les 13 migrations déjà présentes sur la base distante ne sont pas modifiées.
La migration 20260811100000 n'était pas encore appliquée sur la base distante
d'après le dernier `migration list`, donc la correction porte directement sur
le fichier local avant son premier déploiement.

## Vérification recommandée

Après extraction :

```powershell
cd "...\HUMANITAS-WELLNESS-HUB-FINAL-2026-08-13-V5.1-DBA-HARMONISEE-FINAL-CORRIGEE"
npx supabase link --project-ref urlyhjvlmqsetwrualbp
npx supabase migration list
npx supabase db push --dry-run
```

Ne pas utiliser `migration repair` ni `supabase db pull` avant validation du
nouveau `dry-run`.

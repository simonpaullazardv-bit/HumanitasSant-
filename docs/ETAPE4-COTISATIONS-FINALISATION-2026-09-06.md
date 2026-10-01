# HUMANITAS V5.3 — Étape 4 : Cotisations

## Règles consolidées

1. Une cotisation est mensuelle et sa période est normalisée au premier jour du mois.
2. L'échéance réglementaire est automatiquement fixée au **5 du mois concerné**.
3. Après l'échéance, les cotisations `due` ou `partielle` peuvent être basculées en `en_retard` par la routine sécurisée réservée à la finance.
4. Une alerte financière est créée sans doublonner l'alerte du même retard.
5. La sortie de carence nécessite **3 mensualités payées distinctes**.
6. Si un retard persiste après la sortie de carence, l'état métier retourné est `sous_avis_medical`; la décision clinique n'est pas automatisée par cette migration.
7. Les règles RLS et les droits financiers existants restent en vigueur.

## Routine à tester

```sql
select public.traiter_retards();
select public.etat_droits_cotisation('<UUID_ADHERENT>');
```

La migration ne supprime aucune donnée existante et ne modifie pas les médias, la vitrine ou les cartes.

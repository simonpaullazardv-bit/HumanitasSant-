# Base de données Humanitas

Le dossier `database/001_tables.sql ... 010_seed.sql` est conservé comme **historique de conception**.

## Source de vérité de cette version

La source de vérité est :

`supabase/migrations/`

Ne lancez pas les anciens fichiers `database/001...010` en parallèle des migrations Supabase : ils appartiennent à une génération antérieure et contiennent une structure différente.

Pour une installation propre, utilisez un projet Supabase de staging et appliquez les migrations dans l'ordre des noms de fichiers.

# Connexion Supabase — HUMANITASBD

## Projet cible

- Nom métier du projet : `humanitasBD`
- Project ref : `urlyhjvlmqsetwrualbp`
- URL : `https://urlyhjvlmqsetwrualbp.supabase.co`

## Variables

### Navigateur Vite

Seules ces variables sont exposées au bundle :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

La clé `anon` pourra remplacer/compléter la publishable key lorsqu'elle sera fournie, sans modifier le modèle de sécurité.

### Serveur TanStack / fonctions serveur

```env
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_JWKS_URL=...
```

`SUPABASE_SECRET_KEY` et `SUPABASE_JWKS_URL` ne doivent **jamais** être préfixées par `VITE_`.

## Protection

- `.env.local` est ignoré par Git.
- `.env.example` et `.env.local.example` ne contiennent aucun secret réel.
- `src/integrations/supabase/client.ts` utilise uniquement la clé publishable côté navigateur.
- `src/integrations/supabase/client.server.ts` utilise exclusivement `SUPABASE_SECRET_KEY` pour les opérations serveur privilégiées.
- Il n'existe plus de fallback qui transforme une clé publishable/anon en « client admin ».

## Important

Le ZIP remis au propriétaire du projet contient volontairement un `.env.local` local avec les valeurs fournies pour permettre le démarrage immédiat. Ce fichier ne doit jamais être envoyé à un dépôt Git, un hébergeur public, une capture d'écran ou une archive de partage.

Si l'archive est transmise à un tiers, remplacer/faire tourner la clé secrète avant tout usage réel.

## Ordre de raccordement

1. Créer/ouvrir le projet Supabase `humanitasBD`.
2. Vérifier que le Project ref est `urlyhjvlmqsetwrualbp`.
3. Appliquer les migrations dans l'ordre lexical de `supabase/migrations/`.
4. Générer les types Supabase depuis la base réelle.
5. Exécuter les assertions de `tests/DatabaseConsistencyTest.sql`.
6. Tester les RLS par rôle et par identifiant métier.
7. Lancer le frontend Vite avec `.env.local`.
8. Exécuter `npm run lint` puis `npm run build`.

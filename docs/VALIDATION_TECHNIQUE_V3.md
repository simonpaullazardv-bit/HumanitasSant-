# Validation technique V3 — 12 août 2026

## Contrôles effectués

- Contrôle de présence de la route Direction Générale.
- Contrôle des références `directeur_general` dans les types, constantes, configuration, route et migrations.
- Contrôle des migrations : ajout du nouvel ENUM isolé de la migration qui le référence.
- Contrôle de la politique publique `partenaires.is_public`.
- Contrôle des clés `public_*` dans `site_settings`.
- Contrôle de l'absence de statistiques publiques codées en dur dans `src`.
- Contrôle de l'absence de faux numéros de téléphone/e-mails dans les composants publics principaux.
- Contrôle des assets `public/img/gallery/`.
- Contrôle de l'absence de `require()` accidentuel dans le frontend TypeScript.

## Limite de validation locale

Les dépendances npm ne sont pas installées dans l'environnement d'édition. Une tentative d'installation a dépassé le délai disponible et aucun `node_modules` complet n'a été produit. Le build Vite/TypeScript complet n'a donc pas pu être exécuté ici.

La validation finale doit être effectuée après extraction :

```bash
npm install
npm run lint
npm run build
```

Puis, après création du projet Supabase de staging :

```bash
supabase db push
```

et une batterie de tests RLS doit être exécutée avec des comptes distincts.

Cette limite est explicitement conservée dans la documentation afin de ne pas présenter la V3 comme compilée alors que cette preuve n'a pas été obtenue.

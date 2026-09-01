# Base de données — Humanitas Santé

## Source de vérité

La base actuelle du projet est définie par les migrations chronologiques de :

```text
supabase/migrations/
```

Le dossier `database/` est une **ancienne génération SQL conservée pour historique**. Il ne faut pas exécuter `database/001_tables.sql` à `010_seed.sql` en parallèle des migrations Supabase.

## État du modèle au 12/08/2026

Le dépôt contient :

- 58 tables créées par les migrations livrées avant la correction ;
- 7 nouvelles tables ajoutées par la migration d'harmonisation du 12/08 ;
- soit **65 tables déclarées dans les migrations actuelles** ;
- plusieurs vues et fonctions métier supplémentaires.

Le fichier `src/integrations/supabase/types.ts` est un fichier généré et correspondait à un état antérieur de 46 tables. Il doit être **régénéré depuis le schéma Supabase de staging** après application des migrations.

## Principaux domaines

### Identité et adhésion

- `profiles`
- `user_roles`
- `categories_adhesion`
- `adherents`
- `beneficiaires`
- `adhesions`
- `adherent_documents`
- `adherent_historique`

### Finance

- `cotisations`
- `paiements`
- `modes_paiement`
- `operations_financieres`
- `soldes_adherents`
- `alertes_financieres`
- `factures_partenaires`
- `ordres_remboursement`

### Cartes

- `cartes_membre`
- `cartes_impressions`
- `cartes_reimpressions`
- `cartes_scans`
- `matricules_emis`

### Prise en charge et réseau de soins

- `partenaires`
- `partenaire_membres`
- `partenaire_documents`
- `partenaire_historique`
- `partenaire_notifications`
- `contrats_partenaires`
- `prises_en_charge`
- `pec_decisions`
- `pec_prestations`

### CMS

- `cms_pages`
- `cms_sections`
- `cms_bannieres`
- `cms_actualites`
- `cms_evenements`
- `cms_faq`
- `cms_temoignages`
- `cms_services`
- `cms_equipe`
- `cms_telechargements`
- `cms_reseaux_sociaux`
- `cms_medias`
- `app_parametres`

### RH, sécurité et GED

- `personnel`
- `departements`
- `presences_personnel`
- `conges_personnel`
- `missions_transport`
- `depenses_administratives`
- `budgets_annuels`
- `user_sessions`
- `auth_security_logs`
- `failed_login_attempts`
- `ged_documents`
- `parametres_historique`
- `user_notification_preferences`

### Site public

- `contact_messages`
- `callback_requests`
- `appointments`
- `chat_messages`
- `membership_requests`
- `gallery_images`
- `site_settings`

## Règle de déploiement

1. Créer un projet Supabase de **staging**.
2. Appliquer les migrations dans l'ordre chronologique.
3. Régénérer `src/integrations/supabase/types.ts` depuis le schéma réel.
4. Vérifier les RLS et les Storage policies.
5. Lancer les tests SQL et fonctionnels.
6. Seulement après validation, reproduire la structure sur la production.

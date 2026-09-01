# Inventaire des tables — 12/08/2026

**Source :** `supabase/migrations/` du projet analysé.

**Nombre total de tables distinctes déclarées : 65**.

**Nombre de migrations locales après consolidation : 22** (la dernière est additive et n'ajoute pas de table).

| # | Table | Première migration |
|---:|---|---|
| 1 | `adherent_documents` | `20260810111438_d060bd5c-78cd-4fef-a429-23ea327dc146.sql` |
| 2 | `adherent_historique` | `20260810111438_d060bd5c-78cd-4fef-a429-23ea327dc146.sql` |
| 3 | `adherents` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 4 | `adhesions` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 5 | `alertes_financieres` | `20260810113950_55f7301f-8d4f-4f3d-806e-23e96195dd3f.sql` |
| 6 | `app_parametres` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 7 | `appointments` | `20260812133000_humanitas_front_public_and_security_fix.sql` |
| 8 | `audit_logs` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 9 | `auth_security_logs` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 10 | `beneficiaires` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 11 | `budgets_annuels` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 12 | `callback_requests` | `20260812133000_humanitas_front_public_and_security_fix.sql` |
| 13 | `cartes_impressions` | `20260810115914_119cdaa8-bc6b-4a9a-a513-b7b0826fe1a9.sql` |
| 14 | `cartes_membre` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 15 | `cartes_reimpressions` | `20260810115914_119cdaa8-bc6b-4a9a-a513-b7b0826fe1a9.sql` |
| 16 | `cartes_scans` | `20260810115914_119cdaa8-bc6b-4a9a-a513-b7b0826fe1a9.sql` |
| 17 | `categories_adhesion` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 18 | `chat_messages` | `20260812133000_humanitas_front_public_and_security_fix.sql` |
| 19 | `cms_actualites` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 20 | `cms_bannieres` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 21 | `cms_equipe` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 22 | `cms_evenements` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 23 | `cms_faq` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 24 | `cms_medias` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 25 | `cms_pages` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 26 | `cms_reseaux_sociaux` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 27 | `cms_sections` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 28 | `cms_services` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 29 | `cms_telechargements` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 30 | `cms_temoignages` | `20260810104617_4e48181b-8972-44b2-96bd-7ca038c8a061.sql` |
| 31 | `conges_personnel` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 32 | `contact_messages` | `20260812133000_humanitas_front_public_and_security_fix.sql` |
| 33 | `contrats_partenaires` | `20260810123006_5773cfac-6555-4ff7-80cb-2eabbcb9adbd.sql` |
| 34 | `cotisations` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 35 | `departements` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 36 | `depenses_administratives` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 37 | `factures_partenaires` | `20260810123006_5773cfac-6555-4ff7-80cb-2eabbcb9adbd.sql` |
| 38 | `failed_login_attempts` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 39 | `gallery_images` | `20260812133000_humanitas_front_public_and_security_fix.sql` |
| 40 | `ged_documents` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 41 | `matricules_emis` | `20260810111438_d060bd5c-78cd-4fef-a429-23ea327dc146.sql` |
| 42 | `membership_requests` | `20260812133000_humanitas_front_public_and_security_fix.sql` |
| 43 | `missions_transport` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 44 | `modes_paiement` | `20260810113950_55f7301f-8d4f-4f3d-806e-23e96195dd3f.sql` |
| 45 | `notifications_internes` | `20260810124704_eaa8dd0d-7f96-49c7-9b50-e5139e824188.sql` |
| 46 | `operations_financieres` | `20260810113950_55f7301f-8d4f-4f3d-806e-23e96195dd3f.sql` |
| 47 | `ordres_remboursement` | `20260810124704_eaa8dd0d-7f96-49c7-9b50-e5139e824188.sql` |
| 48 | `paiements` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 49 | `parametres_historique` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 50 | `partenaire_documents` | `20260810123006_5773cfac-6555-4ff7-80cb-2eabbcb9adbd.sql` |
| 51 | `partenaire_historique` | `20260810123006_5773cfac-6555-4ff7-80cb-2eabbcb9adbd.sql` |
| 52 | `partenaire_membres` | `20260810123006_5773cfac-6555-4ff7-80cb-2eabbcb9adbd.sql` |
| 53 | `partenaire_notifications` | `20260810123006_5773cfac-6555-4ff7-80cb-2eabbcb9adbd.sql` |
| 54 | `partenaires` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 55 | `pec_decisions` | `20260810124704_eaa8dd0d-7f96-49c7-9b50-e5139e824188.sql` |
| 56 | `pec_prestations` | `20260810124704_eaa8dd0d-7f96-49c7-9b50-e5139e824188.sql` |
| 57 | `personnel` | `20260810115914_119cdaa8-bc6b-4a9a-a513-b7b0826fe1a9.sql` |
| 58 | `presences_personnel` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 59 | `prises_en_charge` | `20260810123006_5773cfac-6555-4ff7-80cb-2eabbcb9adbd.sql` |
| 60 | `profiles` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 61 | `site_settings` | `20260812133000_humanitas_front_public_and_security_fix.sql` |
| 62 | `soldes_adherents` | `20260810113950_55f7301f-8d4f-4f3d-806e-23e96195dd3f.sql` |
| 63 | `user_notification_preferences` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |
| 64 | `user_roles` | `20260810093234_61310af8-0968-45f9-9cda-d558d2272a39.sql` |
| 65 | `user_sessions` | `20260811110000_modules_partenaires_rh_securite_systeme.sql` |

## Dashboards

Le frontend déclare désormais 13 espaces métier principaux :

1. Administration — `/portail/administration`
2. Direction Générale — `/portail/direction-generale`
3. Coordination — `/portail/coordination`
4. Médecine conseil — `/portail/medical`
5. Finance — `/portail/finance`
6. Agent Humanitas — `/portail/agent`
7. Entreprise — `/portail/entreprise`
8. Hôpital — `/portail/hopital`
9. Pharmacie — `/portail/pharmacie`
10. Laboratoire — `/portail/laboratoire`
11. Centre de bien-être — `/portail/centre-bien-etre`
12. Adhérent — `/portail/adherent`
13. Bénéficiaire — `/portail/beneficiaire`

## Tables ajoutées par la correction du 12/08

- `appointments`
- `callback_requests`
- `chat_messages`
- `contact_messages`
- `gallery_images`
- `membership_requests`
- `site_settings`

-- HUMANITAS SANTÉ - SEED LOCAL UNIQUEMENT
-- Ne pas exécuter sur la base distante de production.
-- Compte Super Admin de démonstration local :
-- email    : superadmin@humanitassante.org
-- password : HumanitasLocal#2026!

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin uuid;
  v_bronze uuid;
  v_argent uuid;
  v_or uuid;
  v_platine uuid;
BEGIN
  SELECT id INTO v_admin FROM auth.users WHERE email = 'superadmin@humanitassante.org' LIMIT 1;
  IF v_admin IS NULL THEN
    v_admin := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
      'superadmin@humanitassante.org', crypt('HumanitasLocal#2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Administrateur Humanitas Santé","nom":"Humanitas","prenom":"Super Admin","role":"super_admin"}'::jsonb,
      now(), now(), ''
    );
  END IF;

  INSERT INTO public.profiles (id, full_name, email, fonction, is_active)
  VALUES (v_admin, 'Super Administrateur Humanitas Santé', 'superadmin@humanitassante.org', 'Super Administrateur', true)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, fonction = EXCLUDED.fonction, is_active = true;

  DELETE FROM public.user_roles WHERE user_id = v_admin;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'super_admin');

  INSERT INTO public.categories_adhesion (code, nom, prix_usd, periode, tagline, taux_couverture, ordre, mise_en_avant, is_active)
  VALUES
    ('bronze','Bronze',25,'mois','Couverture essentielle',70,1,false,true),
    ('argent','Argent',50,'mois','Couverture renforcée',80,2,true,true),
    ('or','Or',75,'mois','Couverture supérieure',90,3,false,true),
    ('platine','Platine',100,'mois','Couverture premium',95,4,false,true)
  ON CONFLICT (code) DO UPDATE SET nom=EXCLUDED.nom, prix_usd=EXCLUDED.prix_usd, taux_couverture=EXCLUDED.taux_couverture, is_active=true;

  SELECT id INTO v_bronze FROM public.categories_adhesion WHERE code='bronze';
  SELECT id INTO v_argent FROM public.categories_adhesion WHERE code='argent';
  SELECT id INTO v_or FROM public.categories_adhesion WHERE code='or';
  SELECT id INTO v_platine FROM public.categories_adhesion WHERE code='platine';

  INSERT INTO public.partenaires (nom,slug,type,categorie,description,adresse,commune,ville,telephone,email,conventionne,ordre,is_active)
  VALUES
    ('Lumen Pacis Humanitas','lumen-pacis-humanitas','entreprise','Partenaire institutionnel','Partenaire institutionnel associé à l''écosystème Humanitas.','Victoire, Bâtiment Carrefour des Jeunes','Kalamu','Kinshasa','+243 844 433 025','info@humanitassante.org',true,1,true),
    ('Rapido','rapido','entreprise','Partenaire','Partenaire de démonstration pour les tests de la plateforme.','Victoire, Bâtiment Carrefour des Jeunes','Kalamu','Kinshasa','+243 844 433 025','contact@humanitassante.org',true,2,true),
    ('ASBL Mon Ami','asbl-mon-ami','entreprise','Partenaire','Partenaire associatif de démonstration.','Victoire, Bâtiment Carrefour des Jeunes','Kalamu','Kinshasa','+243 844 433 025','contact@humanitassante.org',true,3,true),
    ('Centre Médical Humanitas Test','centre-medical-humanitas-test','hopital','Partenaire sanitaire de test','Établissement fictif destiné aux tests locaux uniquement.','Kinshasa','Gombe','Kinshasa','+243 810 000 001','test@humanitassante.org',true,4,true),
    ('Pharmacie Humanitas Test','pharmacie-humanitas-test','pharmacie','Partenaire sanitaire de test','Pharmacie fictive destinée aux tests locaux uniquement.','Kinshasa','Gombe','Kinshasa','+243 810 000 002','test@humanitassante.org',true,5,true)
  ON CONFLICT (slug) DO UPDATE SET nom=EXCLUDED.nom, type=EXCLUDED.type, is_active=true;
END $$;

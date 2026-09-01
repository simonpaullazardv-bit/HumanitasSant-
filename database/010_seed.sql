-- ============================================================================
-- HUMANITAS SANTÉ & CENTRE DE BIEN-ÊTRE
-- Architecture de Base de Données PostgreSQL / Supabase
-- Fichier : 010_seed.sql (Données de Démonstration)
-- ============================================================================

-- Insertion de partenaires conventionnés
INSERT INTO public.partenaires (nom_etablissement, type_etablissement, registre_commerce, adresse, ville, telephone, email, taux_conventionne, note_qualite) VALUES
('Centre Hospitalier Universitaire Humanitas', 'Hôpital', 'RC-ABJ-2024-B-001', 'Boulevard de la Santé, Cocody', 'Abidjan', '+225 27 22 40 00 00', 'contact@chu-humanitas.ci', 100.00, 4.90),
('Clinique Médicale Sainte-Geneviève', 'Clinique', 'RC-ABJ-2024-B-002', 'Rue des Jardins, Deux Plateaux', 'Abidjan', '+225 27 22 41 12 00', 'soins@saintegenevieve.ci', 90.00, 4.80),
('Grande Pharmacie Centrale de Marcory', 'Pharmacie', 'RC-ABJ-2024-B-003', 'Avenue Bietry, Marcory', 'Abidjan', '+225 27 21 35 44 22', 'pharmacie@centralemarcory.ci', 100.00, 4.85),
('Laboratoire de Biologie Médicale BioSanté', 'Laboratoire', 'RC-ABJ-2024-B-004', 'Boulevard Lagunaire, Plateau', 'Abidjan', '+225 27 20 22 11 00', 'analyses@biosante.ci', 100.00, 4.95),
('Centre de Bien-Être & Spa Régénération', 'Bien-être', 'RC-ABJ-2024-B-005', 'Zone 4C, Marcory', 'Abidjan', '+225 07 08 09 10 11', 'detente@spa-regeneration.ci', 80.00, 4.75)
ON CONFLICT DO NOTHING;

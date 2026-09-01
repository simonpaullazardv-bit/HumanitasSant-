-- Lecture des médias par les utilisateurs connectés
CREATE POLICY "medias_read_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'medias');

-- Téléversement réservé aux gestionnaires de contenu
CREATE POLICY "medias_insert_cms"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'medias' AND public.can_manage_cms(auth.uid()));

CREATE POLICY "medias_update_cms"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'medias' AND public.can_manage_cms(auth.uid()))
WITH CHECK (bucket_id = 'medias' AND public.can_manage_cms(auth.uid()));

CREATE POLICY "medias_delete_cms"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'medias' AND public.can_manage_cms(auth.uid()));
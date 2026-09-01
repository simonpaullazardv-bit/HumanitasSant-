CREATE POLICY "photos_insert_staff" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medias' AND name LIKE 'photos/%' AND public.can_manage_adherents(auth.uid()));

CREATE POLICY "photos_update_staff" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'medias' AND name LIKE 'photos/%' AND public.can_manage_adherents(auth.uid()))
  WITH CHECK (bucket_id = 'medias' AND name LIKE 'photos/%' AND public.can_manage_adherents(auth.uid()));
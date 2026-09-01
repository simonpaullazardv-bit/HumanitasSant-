-- V5.3 : bucket media commun utilisé par le CMS, les preuves de paiement et les photos.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medias',
  'medias',
  false,
  10485760,
  ARRAY['image/png','image/jpeg','image/webp','video/mp4','video/webm','application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

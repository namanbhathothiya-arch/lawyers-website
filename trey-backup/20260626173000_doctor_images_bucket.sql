-- Ensure doctor photo uploads have a public image-only storage bucket.

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'doctor-images',
    'doctor-images',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view doctor images" ON storage.objects;
CREATE POLICY "Public can view doctor images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'doctor-images');

DROP POLICY IF EXISTS "Authenticated users can upload doctor images" ON storage.objects;
CREATE POLICY "Authenticated users can upload doctor images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doctor-images');

DROP POLICY IF EXISTS "Authenticated users can update doctor images" ON storage.objects;
CREATE POLICY "Authenticated users can update doctor images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'doctor-images')
WITH CHECK (bucket_id = 'doctor-images');

DROP POLICY IF EXISTS "Authenticated users can delete doctor images" ON storage.objects;
CREATE POLICY "Authenticated users can delete doctor images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'doctor-images');

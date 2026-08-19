-- Add image support for services and configure the public storage bucket.

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.services.image_url IS
    'Public URL for the image stored in the service-images bucket.';

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'service-images',
    'service-images',
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

DROP POLICY IF EXISTS service_images_public_select ON storage.objects;
DROP POLICY IF EXISTS service_images_admin_all ON storage.objects;
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete service images" ON storage.objects;

CREATE POLICY "Public can view service images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can upload service images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can update service images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'service-images')
WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can delete service images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'service-images');

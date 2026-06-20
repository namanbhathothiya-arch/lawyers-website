-- Public testimonial portraits with admin-only write access.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'testimonial-images',
    'testimonial-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS testimonial_images_public_select ON storage.objects;
CREATE POLICY testimonial_images_public_select
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'testimonial-images');

DROP POLICY IF EXISTS testimonial_images_admin_all ON storage.objects;
CREATE POLICY testimonial_images_admin_all
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'testimonial-images' AND public.is_admin())
WITH CHECK (bucket_id = 'testimonial-images' AND public.is_admin());

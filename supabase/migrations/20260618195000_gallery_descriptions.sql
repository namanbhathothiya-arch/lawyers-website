-- Audit and add the gallery fields required by the public cards and admin editor.
ALTER TABLE public.gallery_images
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.gallery_images.title IS
    'Required by the gallery admin UI and used as accessible image alt text.';
COMMENT ON COLUMN public.gallery_images.description IS
    'Optional descriptive copy displayed on gallery cards and in the lightbox.';
COMMENT ON COLUMN public.gallery_images.sort_order IS
    'Ascending public display order managed from the gallery admin page.';
COMMENT ON COLUMN public.gallery_images.image_url IS
    'Public URL for the image stored in the clinic-gallery bucket.';

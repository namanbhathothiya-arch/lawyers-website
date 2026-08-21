-- Add is_hero_background column to gallery_images to support distinct Hero Background Image role.

ALTER TABLE public.gallery_images
    ADD COLUMN IF NOT EXISTS is_hero_background BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_gallery_images_hero_background
    ON public.gallery_images (is_hero_background);

-- ============================================================
-- Migration: Remove Gallery Feature
-- Date: 20260827210000
-- 
-- This migration removes:
--   1. gallery_images table (no longer used by any application feature)
--   2. All associated triggers, functions, indexes, and RLS policies
--   3. is_hero_image and is_hero_background columns (were part of the gallery system)
--
-- The hero background is now a fixed static asset in the application.
-- The hero advocate still uses the lawyers.is_featured_hero column (preserved).
--
-- SAFETY: Verify the Supabase project ref matches your .env VITE_SUPABASE_URL
--   .env project ref:        smfcezjspteosqqrvubb
--   supabase/config.toml:    advanced-care-hub (local Docker only)
--
-- Run this SQL in the Supabase Dashboard SQL Editor for project smfcezjspteosqqrvubb
-- ============================================================

BEGIN;

-- 1. Drop triggers that depended on gallery_images columns
DROP TRIGGER IF EXISTS gallery_images_single_hero ON public.gallery_images;

-- 2. Drop functions that depended on gallery_images
DROP FUNCTION IF EXISTS public.enforce_single_hero_gallery_image();

-- 3. Drop unique indexes on gallery_images
DROP INDEX IF EXISTS public.gallery_images_one_hero_idx;
DROP INDEX IF EXISTS public.idx_gallery_images_hero_background;

-- 4. Drop RLS policies on gallery_images
DROP POLICY IF EXISTS "Public Select gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admin All gallery_images" ON public.gallery_images;

-- 5. Drop the gallery_images table entirely
--    (no foreign keys reference this table from other tables)
DROP TABLE IF EXISTS public.gallery_images;

-- 6. Note: lawyers.is_featured_hero is PRESERVED — it's used by the Hero Advocate system.
--    The is_featured_hero trigger on doctors/lawyers table is also preserved.

-- 7. Storage bucket policies for gallery storage can be removed if desired.
--    Run these separately in the Supabase dashboard if you want to remove the bucket:
--
--   DROP POLICY IF EXISTS "Public Select clinic-gallery" ON storage.objects;
--   DROP POLICY IF EXISTS "Admin All clinic-gallery" ON storage.objects;
--   DELETE FROM storage.buckets WHERE id IN ('clinic-gallery', 'firm-gallery');
--
--    NOTE: Only run those if you want to permanently delete uploaded gallery images.
--    They will NOT affect the application since the code no longer references them.

COMMIT;

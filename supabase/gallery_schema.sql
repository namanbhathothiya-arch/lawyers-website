-- Production-Ready SQL Script for Clinic Gallery Configuration
-- Ready to run in the Supabase SQL Editor

-- --------------------------------------------------
-- 1. Create the 'gallery_images' Table
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------
-- 2. Configure Row-Level Security (RLS) on gallery_images
-- --------------------------------------------------
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for 'gallery_images' to avoid conflicts
DROP POLICY IF EXISTS "Public Select gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admin All gallery_images" ON public.gallery_images;

-- Policy A: Public read access for anyone
CREATE POLICY "Public Select gallery_images" ON public.gallery_images
    FOR SELECT TO public
    USING (true);

-- Policy B: Authenticated Admins have full access (insert, update, delete)
CREATE POLICY "Admin All gallery_images" ON public.gallery_images
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
              AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
              AND is_active = true
        )
    );

-- --------------------------------------------------
-- 3. Create the 'clinic-gallery' Storage Bucket
-- --------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-gallery', 'clinic-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for 'clinic-gallery' to avoid conflicts
DROP POLICY IF EXISTS "Public Select clinic-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Admin All clinic-gallery" ON storage.objects;

-- Policy A: Public read access for anyone
CREATE POLICY "Public Select clinic-gallery" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'clinic-gallery');

-- Policy B: Authenticated Admins have full access (insert/upload, update, delete)
CREATE POLICY "Admin All clinic-gallery" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'clinic-gallery'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
              AND is_active = true
        )
    )
    WITH CHECK (
        bucket_id = 'clinic-gallery'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
              AND is_active = true
        )
    );

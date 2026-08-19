-- Production-Ready SQL Script for Supabase Storage Bucket Configuration
-- Ready to run in the Supabase SQL Editor

-- --------------------------------------------------
-- 1. Create the 'lawyer-images' Bucket
-- --------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('lawyer-images', 'lawyer-images', true)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------
-- 2. Configure Row-Level Security (RLS) Policies on storage.objects
-- --------------------------------------------------
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for the 'lawyer-images' bucket to avoid conflict
DROP POLICY IF EXISTS "Public Select lawyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin All lawyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Staff Select lawyer-images" ON storage.objects;

-- Policy A: Public read access for anyone (including anonymous site visitors)
CREATE POLICY "Public Select lawyer-images" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'lawyer-images');

-- Policy B: Authenticated Admins have full access (insert/upload, update, delete)
CREATE POLICY "Admin All lawyer-images" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'lawyer-images'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
              AND is_active = true
        )
    )
    WITH CHECK (
        bucket_id = 'lawyer-images'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
              AND is_active = true
        )
    );

-- Policy C: Staff users have SELECT (read-only) access
CREATE POLICY "Staff Select lawyer-images" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'lawyer-images'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'staff'
              AND is_active = true
        )
    );


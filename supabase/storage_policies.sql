-- Production-Ready SQL Script for Supabase Storage Bucket Configuration
-- Ready to run in the Supabase SQL Editor

-- --------------------------------------------------
-- 1. Create the 'doctor-images' Bucket
-- --------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-images', 'doctor-images', true)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------
-- 2. Configure Row-Level Security (RLS) Policies on storage.objects
-- --------------------------------------------------
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for the 'doctor-images' bucket to avoid conflict
DROP POLICY IF EXISTS "Public Select doctor-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin All doctor-images" ON storage.objects;
DROP POLICY IF EXISTS "Staff Select doctor-images" ON storage.objects;

-- Policy A: Public read access for anyone (including anonymous site visitors)
CREATE POLICY "Public Select doctor-images" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'doctor-images');

-- Policy B: Authenticated Admins have full access (insert/upload, update, delete)
CREATE POLICY "Admin All doctor-images" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'doctor-images'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
              AND is_active = true
        )
    )
    WITH CHECK (
        bucket_id = 'doctor-images'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'admin'
              AND is_active = true
        )
    );

-- Policy C: Staff users have SELECT (read-only) access
CREATE POLICY "Staff Select doctor-images" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'doctor-images'
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role = 'staff'
              AND is_active = true
        )
    );

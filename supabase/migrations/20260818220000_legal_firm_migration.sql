-- 20260818220000_legal_firm_migration.sql
-- Comprehensive Migration from Medical/Clinic to Legal/Law Firm schema

BEGIN;

-- 1. Rename tables safely if old table names exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'doctors') THEN
        ALTER TABLE public.doctors RENAME TO lawyers;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
        ALTER TABLE public.services RENAME TO legal_services;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'doctor_services') THEN
        ALTER TABLE public.doctor_services RENAME TO lawyer_services;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
        ALTER TABLE public.appointments RENAME TO consultations;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'doctor_holidays') THEN
        ALTER TABLE public.doctor_holidays RENAME TO lawyer_holidays;
    END IF;
END $$;

-- 2. Rename columns safely in tables
DO $$
BEGIN
    -- user_roles
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='user_roles' AND column_name='doctor_id') THEN
        ALTER TABLE public.user_roles RENAME COLUMN doctor_id TO lawyer_id;
    END IF;
    
    -- lawyer_services
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='lawyer_services' AND column_name='doctor_id') THEN
        ALTER TABLE public.lawyer_services RENAME COLUMN doctor_id TO lawyer_id;
    END IF;

    -- availability
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='doctor_id') THEN
        ALTER TABLE public.availability RENAME COLUMN doctor_id TO lawyer_id;
    END IF;

    -- consultations
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='doctor_id') THEN
        ALTER TABLE public.consultations RENAME COLUMN doctor_id TO lawyer_id;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='patient_name') THEN
        ALTER TABLE public.consultations RENAME COLUMN patient_name TO client_name;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='patient_phone') THEN
        ALTER TABLE public.consultations RENAME COLUMN patient_phone TO client_phone;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='patient_email') THEN
        ALTER TABLE public.consultations RENAME COLUMN patient_email TO client_email;
    END IF;

    -- lawyer_holidays
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='lawyer_holidays' AND column_name='doctor_id') THEN
        ALTER TABLE public.lawyer_holidays RENAME COLUMN doctor_id TO lawyer_id;
    END IF;

    -- testimonials
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='testimonials' AND column_name='patient_name') THEN
        ALTER TABLE public.testimonials RENAME COLUMN patient_name TO client_name;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='testimonials' AND column_name='patient_label') THEN
        ALTER TABLE public.testimonials RENAME COLUMN patient_label TO client_label;
    END IF;
END $$;

-- 3. Update Constraints and Role Checks in user_roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_doctor_id_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_lawyer_id_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_doctor_link_check;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_lawyer_link_check;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_lawyer_id_key UNIQUE (lawyer_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'lawyer', 'staff'));
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_lawyer_link_check CHECK (
    (role = 'lawyer' AND lawyer_id IS NOT NULL)
    OR (role <> 'lawyer' AND lawyer_id IS NULL)
);

UPDATE public.user_roles SET role = 'lawyer' WHERE role = 'doctor';

-- 4. Update constraints/indexes for double booking and availability
DROP INDEX IF EXISTS public.unique_active_appointment;
DROP INDEX IF EXISTS public.unique_active_consultation;
CREATE UNIQUE INDEX unique_active_consultation 
ON public.consultations (lawyer_id, date, time_slot) 
WHERE status != 'cancelled';

ALTER TABLE public.availability DROP CONSTRAINT IF EXISTS unique_doctor_weekly_slot;
ALTER TABLE public.availability DROP CONSTRAINT IF EXISTS availability_doctor_day_start_key;
ALTER TABLE public.availability DROP CONSTRAINT IF EXISTS unique_lawyer_weekly_slot;
ALTER TABLE public.availability ADD CONSTRAINT unique_lawyer_weekly_slot UNIQUE (lawyer_id, day_of_week, start_time);

ALTER TABLE public.lawyer_holidays DROP CONSTRAINT IF EXISTS unique_doctor_holiday;
ALTER TABLE public.lawyer_holidays DROP CONSTRAINT IF EXISTS doctor_holidays_doctor_date_key;
ALTER TABLE public.lawyer_holidays DROP CONSTRAINT IF EXISTS unique_lawyer_holiday;
ALTER TABLE public.lawyer_holidays ADD CONSTRAINT unique_lawyer_holiday UNIQUE (lawyer_id, date);

-- 5. Drop old views and create updated views
DROP VIEW IF EXISTS public.public_bookings;
DROP VIEW IF EXISTS public.public_consultations;

CREATE VIEW public.public_bookings AS
SELECT 
    id,
    lawyer_id,
    lawyer_id AS doctor_id,
    date,
    time_slot,
    status
FROM public.consultations
WHERE status != 'cancelled';

CREATE VIEW public.public_consultations AS
SELECT 
    id,
    lawyer_id,
    date,
    time_slot,
    status
FROM public.consultations
WHERE status != 'cancelled';

-- 6. Helper Functions
CREATE OR REPLACE FUNCTION public.current_lawyer_id()
RETURNS uuid AS $$
DECLARE
    lawyer_uuid uuid;
BEGIN
    SELECT lawyer_id INTO lawyer_uuid
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'lawyer' AND is_active = true;

    RETURN lawyer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.enforce_single_featured_hero_lawyer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_featured_hero THEN
        UPDATE public.lawyers
        SET is_featured_hero = false
        WHERE id <> NEW.id
          AND is_featured_hero = true;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_single_featured_hero ON public.lawyers;
DROP TRIGGER IF EXISTS lawyers_single_featured_hero ON public.lawyers;

CREATE TRIGGER lawyers_single_featured_hero
BEFORE INSERT OR UPDATE OF is_featured_hero ON public.lawyers
FOR EACH ROW
WHEN (NEW.is_featured_hero = true)
EXECUTE FUNCTION public.enforce_single_featured_hero_lawyer();

-- 7. Storage Buckets & Migration of objects
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lawyer-images',
    'lawyer-images',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.objects SET bucket_id = 'lawyer-images' WHERE bucket_id = 'doctor-images';

-- 8. Storage RLS Policies
DROP POLICY IF EXISTS "Public Select doctor-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin All doctor-images" ON storage.objects;
DROP POLICY IF EXISTS "Staff Select doctor-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Select lawyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin All lawyer-images" ON storage.objects;

CREATE POLICY "Public Select lawyer-images" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'lawyer-images');

CREATE POLICY "Admin All lawyer-images" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'lawyer-images'
        AND public.is_admin()
    )
    WITH CHECK (
        bucket_id = 'lawyer-images'
        AND public.is_admin()
    );

-- 9. RLS Policies on Tables
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all ON public.lawyers;
DROP POLICY IF EXISTS public_select ON public.lawyers;
CREATE POLICY admin_all ON public.lawyers FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS admin_all ON public.legal_services;
DROP POLICY IF EXISTS public_select ON public.legal_services;
CREATE POLICY admin_all ON public.legal_services FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.legal_services FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS admin_all ON public.lawyer_services;
DROP POLICY IF EXISTS public_select ON public.lawyer_services;
CREATE POLICY admin_all ON public.lawyer_services FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyer_services FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS admin_all ON public.availability;
DROP POLICY IF EXISTS public_select ON public.availability;
CREATE POLICY admin_all ON public.availability FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.availability FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS admin_all ON public.consultations;
DROP POLICY IF EXISTS staff_select ON public.consultations;
DROP POLICY IF EXISTS staff_update ON public.consultations;
DROP POLICY IF EXISTS lawyer_select_own ON public.consultations;
DROP POLICY IF EXISTS public_insert ON public.consultations;
DROP POLICY IF EXISTS doctor_select_own ON public.consultations;
DROP POLICY IF EXISTS staff_manage ON public.consultations;

CREATE POLICY admin_all ON public.consultations FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY staff_select ON public.consultations FOR SELECT TO authenticated USING (public.has_role('staff'));
CREATE POLICY staff_update ON public.consultations FOR UPDATE TO authenticated USING (public.has_role('staff')) WITH CHECK (public.has_role('staff'));
CREATE POLICY lawyer_select_own ON public.consultations FOR SELECT TO authenticated USING (lawyer_id = public.current_lawyer_id());
CREATE POLICY public_insert ON public.consultations FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS admin_all ON public.lawyer_holidays;
DROP POLICY IF EXISTS public_select ON public.lawyer_holidays;
CREATE POLICY admin_all ON public.lawyer_holidays FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyer_holidays FOR SELECT TO anon, authenticated USING (true);

-- 10. Grants
GRANT SELECT ON public.lawyers TO anon, authenticated;
GRANT SELECT ON public.legal_services TO anon, authenticated;
GRANT SELECT ON public.lawyer_services TO anon, authenticated;
GRANT SELECT ON public.availability TO anon, authenticated;
GRANT SELECT ON public.consultations TO anon, authenticated;
GRANT SELECT ON public.lawyer_holidays TO anon, authenticated;
GRANT SELECT ON public.public_bookings TO anon, authenticated;
GRANT SELECT ON public.public_consultations TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.lawyers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.legal_services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lawyer_services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lawyer_holidays TO authenticated;

COMMIT;

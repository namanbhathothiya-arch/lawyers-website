-- HeartCare Advanced Clinic
-- Complete production delivery schema for a brand-new Supabase project.
--
-- Run this file once in the Supabase SQL Editor before creating the first
-- admin role and deploying the Edge Functions.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------
-- Clean installation
-- --------------------------------------------------

DROP POLICY IF EXISTS "Public Select doctor-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin All doctor-images" ON storage.objects;
DROP POLICY IF EXISTS "Staff Select doctor-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Select clinic-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Admin All clinic-gallery" ON storage.objects;
DROP POLICY IF EXISTS doctor_images_public_select ON storage.objects;
DROP POLICY IF EXISTS doctor_images_admin_all ON storage.objects;
DROP POLICY IF EXISTS clinic_gallery_public_select ON storage.objects;
DROP POLICY IF EXISTS clinic_gallery_admin_all ON storage.objects;
DROP POLICY IF EXISTS testimonial_images_public_select ON storage.objects;
DROP POLICY IF EXISTS testimonial_images_admin_all ON storage.objects;

DROP VIEW IF EXISTS public.public_bookings;

DROP TABLE IF EXISTS public.gallery_images CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.admin_verified_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_phone_challenges CASCADE;
DROP TABLE IF EXISTS public.doctor_holidays CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.availability CASCADE;
DROP TABLE IF EXISTS public.doctor_services CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;

DROP FUNCTION IF EXISTS public.current_doctor_id();
DROP FUNCTION IF EXISTS public.has_role(text);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.enforce_single_featured_hero_doctor();
DROP FUNCTION IF EXISTS public.enforce_single_hero_gallery_image();
DROP FUNCTION IF EXISTS public.sync_admin_phone_to_auth();

-- --------------------------------------------------
-- Core tables
-- --------------------------------------------------

CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience TEXT NOT NULL,
    photo TEXT,
    bio TEXT,
    is_featured_hero BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    admin_phone TEXT CHECK (
        admin_phone IS NULL
        OR admin_phone ~ '^\+[1-9][0-9]{7,14}$'
    ),
    role TEXT NOT NULL DEFAULT 'staff'
        CHECK (role IN ('admin', 'doctor', 'staff')),
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_user_id_key UNIQUE (user_id),
    CONSTRAINT user_roles_doctor_id_key UNIQUE (doctor_id),
    CONSTRAINT user_roles_doctor_link_check CHECK (
        (role = 'doctor' AND doctor_id IS NOT NULL)
        OR (role <> 'doctor' AND doctor_id IS NULL)
    )
);

CREATE TABLE public.doctor_services (
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (doctor_id, service_id)
);

CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60
        CHECK (slot_duration_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT availability_time_order_check CHECK (end_time > start_time),
    CONSTRAINT availability_doctor_day_start_key
        UNIQUE (doctor_id, day_of_week, start_time)
);

CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'booked'
        CHECK (
            status IN (
                'pending_payment',
                'booked',
                'confirmed',
                'checked_in',
                'completed',
                'cancelled',
                'no_show'
            )
        ),
    payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            payment_status IN (
                'pending',
                'paid',
                'refund_pending',
                'refunded',
                'failed'
            )
        ),
    payment_id TEXT,
    order_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT appointments_payment_id_key UNIQUE (payment_id)
);

CREATE TABLE public.doctor_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT doctor_holidays_doctor_date_key UNIQUE (doctor_id, date)
);

CREATE TABLE public.gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_hero_image BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name TEXT NOT NULL,
    patient_label TEXT,
    review TEXT NOT NULL CHECK (char_length(review) <= 700),
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL CHECK (char_length(question) <= 1000),
    answer TEXT NOT NULL CHECK (char_length(answer) <= 2000),
    category TEXT CHECK (category IS NULL OR char_length(category) <= 80),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------
-- Indexes and booking constraints
-- --------------------------------------------------

CREATE INDEX idx_user_roles_role_active
    ON public.user_roles (role, is_active);
CREATE INDEX idx_doctor_services_service_id
    ON public.doctor_services (service_id);
CREATE INDEX idx_availability_doctor_day
    ON public.availability (doctor_id, day_of_week);
CREATE INDEX idx_appointments_service_id
    ON public.appointments (service_id);
CREATE INDEX idx_appointments_date_status
    ON public.appointments (date, status);
CREATE INDEX idx_doctor_holidays_date
    ON public.doctor_holidays (date);
CREATE INDEX idx_gallery_images_sort_order
    ON public.gallery_images (sort_order, created_at);
CREATE INDEX idx_testimonials_published_order
    ON public.testimonials (is_published, sort_order, created_at);
CREATE INDEX idx_faqs_published_order
    ON public.faqs (is_published, sort_order, created_at);
CREATE UNIQUE INDEX doctors_one_featured_hero_idx
    ON public.doctors (is_featured_hero)
    WHERE is_featured_hero = true;
CREATE UNIQUE INDEX gallery_images_one_hero_idx
    ON public.gallery_images (is_hero_image)
    WHERE is_hero_image = true;

CREATE UNIQUE INDEX unique_active_appointment
    ON public.appointments (doctor_id, date, time_slot)
    WHERE status <> 'cancelled';

-- --------------------------------------------------
-- Exclusive homepage hero selections
-- --------------------------------------------------

CREATE FUNCTION public.enforce_single_featured_hero_doctor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_featured_hero THEN
        UPDATE public.doctors
        SET is_featured_hero = false
        WHERE id <> NEW.id
          AND is_featured_hero = true;
    END IF;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.enforce_single_hero_gallery_image()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_hero_image THEN
        UPDATE public.gallery_images
        SET is_hero_image = false
        WHERE id <> NEW.id
          AND is_hero_image = true;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER doctors_single_featured_hero
BEFORE INSERT OR UPDATE OF is_featured_hero ON public.doctors
FOR EACH ROW
WHEN (NEW.is_featured_hero = true)
EXECUTE FUNCTION public.enforce_single_featured_hero_doctor();

CREATE TRIGGER gallery_images_single_hero
BEFORE INSERT OR UPDATE OF is_hero_image ON public.gallery_images
FOR EACH ROW
WHEN (NEW.is_hero_image = true)
EXECUTE FUNCTION public.enforce_single_hero_gallery_image();

-- --------------------------------------------------
-- Privacy-safe public booking availability
-- --------------------------------------------------

CREATE VIEW public.public_bookings
WITH (security_barrier = true)
AS
SELECT
    id,
    doctor_id,
    date,
    time_slot,
    status
FROM public.appointments
WHERE status <> 'cancelled';

COMMENT ON VIEW public.public_bookings IS
    'Public slot occupancy without patient or payment information.';

-- --------------------------------------------------
-- RLS helper functions
-- --------------------------------------------------

CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles AS roles
        WHERE roles.user_id = auth.uid()
          AND roles.role = 'admin'
          AND roles.is_active = true
    );
$$;

CREATE FUNCTION public.has_role(check_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = check_role
          AND is_active = true
    );
$$;

CREATE FUNCTION public.current_doctor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT doctor_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'doctor'
      AND is_active = true
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_doctor_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_doctor_id() TO authenticated;

-- --------------------------------------------------
-- Row Level Security
-- --------------------------------------------------

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_phone_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_verified_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_admin_all
ON public.user_roles
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Filtering inactive rows here makes the current client-side role lookup deny
-- disabled accounts without requiring a separate is_active client query.
CREATE POLICY user_roles_select_active_own
ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY doctors_public_select
ON public.doctors
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY doctors_admin_all
ON public.doctors
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY services_public_select
ON public.services
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY services_admin_all
ON public.services
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY doctor_services_public_select
ON public.doctor_services
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY doctor_services_admin_all
ON public.doctor_services
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY availability_public_select
ON public.availability
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY availability_admin_all
ON public.availability
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY appointments_admin_all
ON public.appointments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY appointments_staff_select
ON public.appointments
FOR SELECT TO authenticated
USING (public.has_role('staff'));

CREATE POLICY appointments_staff_update
ON public.appointments
FOR UPDATE TO authenticated
USING (public.has_role('staff'))
WITH CHECK (public.has_role('staff'));

CREATE POLICY appointments_doctor_select_own
ON public.appointments
FOR SELECT TO authenticated
USING (doctor_id = public.current_doctor_id());

CREATE POLICY doctor_holidays_public_select
ON public.doctor_holidays
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY doctor_holidays_admin_all
ON public.doctor_holidays
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY gallery_images_public_select
ON public.gallery_images
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY gallery_images_admin_all
ON public.gallery_images
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY testimonials_public_select
ON public.testimonials
FOR SELECT TO anon, authenticated
USING (is_published = true OR public.is_admin());

CREATE POLICY testimonials_admin_all
ON public.testimonials
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY faqs_public_select
ON public.faqs
FOR SELECT TO anon, authenticated
USING (is_published = true OR public.is_admin());

CREATE POLICY faqs_admin_all
ON public.faqs
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --------------------------------------------------
-- API grants
-- --------------------------------------------------

REVOKE ALL ON public.user_roles FROM anon, authenticated;
REVOKE ALL ON public.doctors FROM anon, authenticated;
REVOKE ALL ON public.services FROM anon, authenticated;
REVOKE ALL ON public.doctor_services FROM anon, authenticated;
REVOKE ALL ON public.availability FROM anon, authenticated;
REVOKE ALL ON public.appointments FROM anon, authenticated;
REVOKE ALL ON public.doctor_holidays FROM anon, authenticated;
REVOKE ALL ON public.gallery_images FROM anon, authenticated;
REVOKE ALL ON public.testimonials FROM anon, authenticated;
REVOKE ALL ON public.faqs FROM anon, authenticated;
REVOKE ALL ON public.public_bookings FROM anon, authenticated;

GRANT SELECT ON public.doctors TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.doctor_services TO anon, authenticated;
GRANT SELECT ON public.availability TO anon, authenticated;
GRANT SELECT ON public.doctor_holidays TO anon, authenticated;
GRANT SELECT ON public.gallery_images TO anon, authenticated;
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT SELECT ON public.public_bookings TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctor_services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctor_holidays TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'How do I book an appointment?',
    'You can book online through the appointment page or call the clinic directly. After choosing a service, doctor, date, and available time slot, we will confirm your booking details.',
    'Appointments',
    0,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'How do I book an appointment?'
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'What should I bring for my first visit?',
    'Please bring previous prescriptions, investigation reports, current medications, and any discharge summaries if available. This helps the doctor understand your health history clearly.',
    'Visit preparation',
    1,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'What should I bring for my first visit?'
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'Are service prices transparent?',
    'Yes. Service prices are shown before booking wherever available. If a service needs additional tests or procedures, the care team will explain those costs before proceeding.',
    'Billing',
    2,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'Are service prices transparent?'
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'Is follow-up support included?',
    'Most consultations include a clear follow-up plan. The doctor will explain when you should return, whether further tests are needed, and how to continue your treatment safely.',
    'After care',
    3,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'Is follow-up support included?'
);

-- --------------------------------------------------
-- Storage buckets and policies
-- --------------------------------------------------

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES
    (
        'doctor-images',
        'doctor-images',
        true,
        5242880,
        ARRAY['image/png', 'image/jpeg', 'image/webp']
    ),
    (
        'clinic-gallery',
        'clinic-gallery',
        true,
        5242880,
        ARRAY['image/png', 'image/jpeg', 'image/webp']
    ),
    (
        'testimonial-images',
        'testimonial-images',
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

CREATE POLICY doctor_images_public_select
ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'doctor-images');

CREATE POLICY doctor_images_admin_all
ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'doctor-images' AND public.is_admin())
WITH CHECK (bucket_id = 'doctor-images' AND public.is_admin());

CREATE POLICY clinic_gallery_public_select
ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'clinic-gallery');

CREATE POLICY clinic_gallery_admin_all
ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'clinic-gallery' AND public.is_admin())
WITH CHECK (bucket_id = 'clinic-gallery' AND public.is_admin());

CREATE POLICY testimonial_images_public_select
ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'testimonial-images');

CREATE POLICY testimonial_images_admin_all
ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'testimonial-images' AND public.is_admin())
WITH CHECK (bucket_id = 'testimonial-images' AND public.is_admin());

COMMIT;

-- --------------------------------------------------
-- First administrator
-- --------------------------------------------------
-- Create the user in Supabase Authentication first, then run:
--
-- INSERT INTO public.user_roles (user_id, full_name, role, is_active)
-- VALUES ('AUTH-USER-UUID', 'Administrator Name', 'admin', true);
--
-- Doctor accounts require both an auth.users row and a doctors row:
--
-- INSERT INTO public.user_roles (user_id, full_name, role, doctor_id, is_active)
-- VALUES (
--     'AUTH-USER-UUID',
--     'Dr. Raj Sharma',
--     'doctor',
--     'DOCTOR-ROW-UUID',
--     true
-- );

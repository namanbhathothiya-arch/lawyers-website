-- Production-Ready SQL Schema for Advanced Care Medical Clinic
-- Ready to paste into the Supabase SQL Editor

-- --------------------------------------------------
-- 1. Enable Necessary Extensions
-- --------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------
-- 2. Drop Existing Views and Tables (Optional, for clean recreation)
-- --------------------------------------------------
DROP VIEW IF EXISTS public.public_bookings;
DROP TABLE IF EXISTS public.doctor_holidays;
DROP TABLE IF EXISTS public.faqs;
DROP TABLE IF EXISTS public.testimonials;
DROP TABLE IF EXISTS public.admin_verified_sessions;
DROP TABLE IF EXISTS public.admin_phone_challenges;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public.availability;
DROP TABLE IF EXISTS public.doctor_services;
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.doctors;
DROP TABLE IF EXISTS public.user_roles;

-- --------------------------------------------------
-- 3. Create Tables
-- --------------------------------------------------

-- Table: user_roles (Role-based access control)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    admin_phone TEXT CHECK (
        admin_phone IS NULL
        OR admin_phone ~ '^\+[1-9][0-9]{7,14}$'
    ),
    role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'staff')) DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- Table: doctors
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

CREATE UNIQUE INDEX doctors_one_featured_hero_idx
    ON public.doctors (is_featured_hero)
    WHERE is_featured_hero = true;

CREATE OR REPLACE FUNCTION public.enforce_single_featured_hero_doctor()
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

CREATE TRIGGER doctors_single_featured_hero
BEFORE INSERT OR UPDATE OF is_featured_hero ON public.doctors
FOR EACH ROW
WHEN (NEW.is_featured_hero = true)
EXECUTE FUNCTION public.enforce_single_featured_hero_doctor();

ALTER TABLE public.user_roles
    ADD COLUMN doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_faqs_published_order
    ON public.faqs (is_published, sort_order, created_at);

-- Table: services
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL, -- Stored as text to match original mock (e.g. "₹600", "From ₹500")
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

-- Table: doctor_services (Join table for Doctors and Services)
CREATE TABLE public.doctor_services (
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (doctor_id, service_id)
);

-- Table: availability (General weekly working hours)
CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0: Sunday, 1: Monday, ..., 6: Saturday
    start_time TIME NOT NULL, -- e.g. '09:00:00'
    end_time TIME NOT NULL, -- e.g. '17:00:00'
    slot_duration_minutes INT NOT NULL DEFAULT 60 CHECK (slot_duration_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_doctor_weekly_slot UNIQUE (doctor_id, day_of_week, start_time)
);

-- Table: appointments (Patient bookings)
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_payment', 'booked', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')) DEFAULT 'booked',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refund_pending', 'refunded', 'failed')) DEFAULT 'pending',
    payment_id TEXT CONSTRAINT unique_payment_id UNIQUE, -- References Razorpay / stripe payment IDs
    order_id TEXT, -- References Razorpay order IDs
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: doctor_holidays (Specific dates when a doctor is not working)
CREATE TABLE public.doctor_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_doctor_holiday UNIQUE (doctor_id, date)
);

-- --------------------------------------------------
-- 4. Double-Booking Prevention
-- --------------------------------------------------
-- Partial unique index ensures that a doctor cannot have more than one
-- active (i.e. not cancelled) appointment at the exact same date and time slot.
CREATE UNIQUE INDEX unique_active_appointment 
ON public.appointments (doctor_id, date, time_slot) 
WHERE status != 'cancelled';

-- --------------------------------------------------
-- 5. Public Bookings View (Patient Privacy)
-- --------------------------------------------------
-- View to check slot occupancy without exposing patient name, phone, or email.
CREATE OR REPLACE VIEW public.public_bookings AS
SELECT 
    id,
    doctor_id,
    date,
    time_slot,
    status
FROM public.appointments
WHERE status != 'cancelled';

-- --------------------------------------------------
-- 6. Enable Row Level Security (RLS)
-- --------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_holidays ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- 7. Helper Functions for RLS
-- --------------------------------------------------

-- Check if the current authenticated user has the 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
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

-- Check if the current authenticated user has the requested role
CREATE OR REPLACE FUNCTION public.has_role(check_role TEXT)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = check_role
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve the doctor profile linked to the current authenticated user
CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS uuid AS $$
DECLARE
    doctor_uuid uuid;
BEGIN
    SELECT doctor_id INTO doctor_uuid
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'doctor';

    RETURN doctor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------
-- 8. Row Level Security Policies
-- --------------------------------------------------

-- -- user_roles --
-- Admins have full access
CREATE POLICY admin_all ON public.user_roles 
    FOR ALL TO authenticated USING (public.is_admin());
-- Users can view their own roles
CREATE POLICY select_own ON public.user_roles 
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- -- doctors --
-- Admins have full access
CREATE POLICY admin_all ON public.doctors 
    FOR ALL TO authenticated USING (public.is_admin());
-- Public read access
CREATE POLICY public_select ON public.doctors 
    FOR SELECT TO anon, authenticated USING (true);

-- -- services --
-- Admins have full access
CREATE POLICY admin_all ON public.services 
    FOR ALL TO authenticated USING (public.is_admin());
-- Public read access
CREATE POLICY public_select ON public.services 
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY admin_all ON public.testimonials
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
CREATE POLICY public_select ON public.testimonials
    FOR SELECT TO anon, authenticated
    USING (is_published = true OR public.is_admin());

CREATE POLICY admin_all ON public.faqs
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
CREATE POLICY public_select ON public.faqs
    FOR SELECT TO anon, authenticated
    USING (is_published = true OR public.is_admin());

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

-- -- doctor_services --
-- Admins have full access
CREATE POLICY admin_all ON public.doctor_services 
    FOR ALL TO authenticated USING (public.is_admin());
-- Public read access
CREATE POLICY public_select ON public.doctor_services 
    FOR SELECT TO anon, authenticated USING (true);

-- -- availability --
-- Admins have full access
CREATE POLICY admin_all ON public.availability 
    FOR ALL TO authenticated USING (public.is_admin());
-- Public read access
CREATE POLICY public_select ON public.availability 
    FOR SELECT TO anon, authenticated USING (true);

-- -- appointments --
-- Admins have full access
CREATE POLICY admin_all ON public.appointments 
    FOR ALL TO authenticated USING (public.is_admin());
-- Reception/staff can manage appointment workflow, but not clinical catalog data
CREATE POLICY staff_manage ON public.appointments
    FOR SELECT TO authenticated USING (public.has_role('staff'));
CREATE POLICY staff_update ON public.appointments
    FOR UPDATE TO authenticated USING (public.has_role('staff')) WITH CHECK (public.has_role('staff'));
-- Doctors can view appointments linked to their doctor profile
CREATE POLICY doctor_select_own ON public.appointments
    FOR SELECT TO authenticated USING (doctor_id = public.current_doctor_id());
-- Public patients can book appointments
CREATE POLICY public_insert ON public.appointments 
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- -- doctor_holidays --
-- Admins have full access
CREATE POLICY admin_all ON public.doctor_holidays 
    FOR ALL TO authenticated USING (public.is_admin());
-- Public read access
CREATE POLICY public_select ON public.doctor_holidays 
    FOR SELECT TO anon, authenticated USING (true);

-- --------------------------------------------------
-- 9. Grants
-- --------------------------------------------------
GRANT SELECT ON public.public_bookings TO anon, authenticated;

-- --------------------------------------------------
-- 10. Manual Admin Assignment Instructions
-- --------------------------------------------------
-- NOTE: Admins must be manually assigned. 
-- 1. Create a user via Supabase Auth dashboard or sign-in flow.
-- 2. Find their User ID (UUID) from auth.users.
-- 3. Run the following SQL to make them an admin:
-- 
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('USER-UUID-HERE', 'admin');

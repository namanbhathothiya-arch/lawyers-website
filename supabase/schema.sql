-- Production-Ready SQL Schema for Sharma & Associates Law Firm
-- Ready to paste into the Supabase SQL Editor

-- --------------------------------------------------
-- 1. Enable Necessary Extensions
-- --------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------
-- 2. Drop Existing Views and Tables (Optional, for clean recreation)
-- --------------------------------------------------
DROP VIEW IF EXISTS public.public_consultations;
DROP VIEW IF EXISTS public.public_bookings;
DROP TABLE IF EXISTS public.lawyer_holidays;
DROP TABLE IF EXISTS public.faqs;
DROP TABLE IF EXISTS public.testimonials;
DROP TABLE IF EXISTS public.admin_verified_sessions;
DROP TABLE IF EXISTS public.admin_phone_challenges;
DROP TABLE IF EXISTS public.consultations;
DROP TABLE IF EXISTS public.availability;
DROP TABLE IF EXISTS public.lawyer_services;
DROP TABLE IF EXISTS public.legal_services;
DROP TABLE IF EXISTS public.lawyers;
DROP TABLE IF EXISTS public.user_roles;

-- --------------------------------------------------
-- 3. Create Tables
-- --------------------------------------------------

-- Table: lawyers
CREATE TABLE public.lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience TEXT NOT NULL,
    photo TEXT,
    bio TEXT,
    phone_number TEXT,
    whatsapp_number TEXT,
    is_featured_hero BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX lawyers_one_featured_hero_idx
    ON public.lawyers (is_featured_hero)
    WHERE is_featured_hero = true;

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

CREATE TRIGGER lawyers_single_featured_hero
BEFORE INSERT OR UPDATE OF is_featured_hero ON public.lawyers
FOR EACH ROW
WHEN (NEW.is_featured_hero = true)
EXECUTE FUNCTION public.enforce_single_featured_hero_lawyer();

-- Table: user_roles (Role-based access control)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    admin_phone TEXT CHECK (
        admin_phone IS NULL
        OR admin_phone ~ '^\+[1-9][0-9]{7,14}$'
    ),
    role TEXT NOT NULL CHECK (role IN ('admin', 'lawyer', 'staff')) DEFAULT 'admin',
    lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Table: legal_services
CREATE TABLE public.legal_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_label TEXT,
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

CREATE INDEX idx_faqs_published_order
    ON public.faqs (is_published, sort_order, created_at);

-- Table: lawyer_services (Join table for Lawyers and Legal Services)
CREATE TABLE public.lawyer_services (
    lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.legal_services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (lawyer_id, service_id)
);

-- Table: availability (General weekly working hours)
CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 60 CHECK (slot_duration_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_lawyer_weekly_slot UNIQUE (lawyer_id, day_of_week, start_time)
);

-- Table: consultations (Client bookings)
CREATE TABLE public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.legal_services(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_payment', 'booked', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')) DEFAULT 'booked',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refund_pending', 'refunded', 'failed')) DEFAULT 'pending',
    payment_id TEXT CONSTRAINT unique_payment_id UNIQUE,
    order_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: lawyer_holidays (Specific dates when a lawyer is unavailable)
CREATE TABLE public.lawyer_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_lawyer_holiday UNIQUE (lawyer_id, date)
);

-- --------------------------------------------------
-- 4. Double-Booking Prevention
-- --------------------------------------------------
CREATE UNIQUE INDEX unique_active_consultation 
ON public.consultations (lawyer_id, date, time_slot) 
WHERE status != 'cancelled';

-- --------------------------------------------------
-- 5. Public Bookings & Consultations Views (Client Privacy)
-- --------------------------------------------------
CREATE OR REPLACE VIEW public.public_bookings AS
SELECT 
    id,
    lawyer_id,
    lawyer_id AS doctor_id,
    date,
    time_slot,
    status
FROM public.consultations
WHERE status != 'cancelled';

CREATE OR REPLACE VIEW public.public_consultations AS
SELECT 
    id,
    lawyer_id,
    date,
    time_slot,
    status
FROM public.consultations
WHERE status != 'cancelled';

-- --------------------------------------------------
-- 6. Enable Row Level Security (RLS)
-- --------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_holidays ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- 7. Helper Functions for RLS
-- --------------------------------------------------

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

CREATE OR REPLACE FUNCTION public.current_lawyer_id()
RETURNS uuid AS $$
DECLARE
    lawyer_uuid uuid;
BEGIN
    SELECT lawyer_id INTO lawyer_uuid
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'lawyer';

    RETURN lawyer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------
-- 8. Row Level Security Policies
-- --------------------------------------------------

CREATE POLICY admin_all ON public.user_roles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY select_own ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY admin_all ON public.lawyers FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY admin_all ON public.legal_services FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.legal_services FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY admin_all ON public.testimonials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY public_select ON public.testimonials FOR SELECT TO anon, authenticated USING (is_published = true OR public.is_admin());

CREATE POLICY admin_all ON public.faqs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY public_select ON public.faqs FOR SELECT TO anon, authenticated USING (is_published = true OR public.is_admin());

CREATE POLICY admin_all ON public.lawyer_services FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyer_services FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY admin_all ON public.availability FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.availability FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY admin_all ON public.consultations FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY staff_select ON public.consultations FOR SELECT TO authenticated USING (public.has_role('staff'));
CREATE POLICY staff_update ON public.consultations FOR UPDATE TO authenticated USING (public.has_role('staff')) WITH CHECK (public.has_role('staff'));
CREATE POLICY lawyer_select_own ON public.consultations FOR SELECT TO authenticated USING (lawyer_id = public.current_lawyer_id());
CREATE POLICY public_insert ON public.consultations FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY admin_all ON public.lawyer_holidays FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyer_holidays FOR SELECT TO anon, authenticated USING (true);

-- --------------------------------------------------
-- 9. Grants
-- --------------------------------------------------
GRANT SELECT ON public.public_bookings TO anon, authenticated;
GRANT SELECT ON public.public_consultations TO anon, authenticated;

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'How do I book a legal consultation?',
    'You can book online through our consultation booking page or call our firm directly. Choose a legal service, preferred lawyer, date, and available time slot to confirm your booking.',
    'Consultations',
    0,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'How do I book a legal consultation?'
);

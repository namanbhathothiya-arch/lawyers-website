-- Sharma & Associates Law Firm
-- Complete production delivery schema for a brand-new Supabase project.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------
-- Clean installation
-- --------------------------------------------------

DROP POLICY IF EXISTS "Public Select lawyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin All lawyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Staff Select lawyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Select firm-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Admin All firm-gallery" ON storage.objects;
DROP POLICY IF EXISTS lawyer_images_public_select ON storage.objects;
DROP POLICY IF EXISTS lawyer_images_admin_all ON storage.objects;
DROP POLICY IF EXISTS firm_gallery_public_select ON storage.objects;
DROP POLICY IF EXISTS firm_gallery_admin_all ON storage.objects;
DROP POLICY IF EXISTS testimonial_images_public_select ON storage.objects;
DROP POLICY IF EXISTS testimonial_images_admin_all ON storage.objects;

DROP VIEW IF EXISTS public.public_consultations;
DROP VIEW IF EXISTS public.public_bookings;

DROP TABLE IF EXISTS public.gallery_images CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.admin_verified_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_phone_challenges CASCADE;
DROP TABLE IF EXISTS public.lawyer_holidays CASCADE;
DROP TABLE IF EXISTS public.consultations CASCADE;
DROP TABLE IF EXISTS public.availability CASCADE;
DROP TABLE IF EXISTS public.lawyer_services CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.legal_services CASCADE;
DROP TABLE IF EXISTS public.lawyers CASCADE;

DROP FUNCTION IF EXISTS public.current_lawyer_id();
DROP FUNCTION IF EXISTS public.has_role(text);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.enforce_single_featured_hero_lawyer();
DROP FUNCTION IF EXISTS public.enforce_single_hero_gallery_image();

-- --------------------------------------------------
-- Core tables
-- --------------------------------------------------

CREATE TABLE public.lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience TEXT NOT NULL,
    photo TEXT,
    bio TEXT,
    is_featured_hero BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.legal_services (
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
        CHECK (role IN ('admin', 'lawyer', 'staff')),
    lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_user_id_key UNIQUE (user_id),
    CONSTRAINT user_roles_lawyer_id_key UNIQUE (lawyer_id),
    CONSTRAINT user_roles_lawyer_link_check CHECK (
        (role = 'lawyer' AND lawyer_id IS NOT NULL)
        OR (role <> 'lawyer' AND lawyer_id IS NULL)
    )
);

CREATE TABLE public.lawyer_services (
    lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.legal_services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (lawyer_id, service_id)
);

CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60
        CHECK (slot_duration_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT availability_time_order_check CHECK (end_time > start_time),
    CONSTRAINT availability_lawyer_day_start_key
        UNIQUE (lawyer_id, day_of_week, start_time)
);

CREATE TABLE public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.legal_services(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT NOT NULL,
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
    CONSTRAINT consultations_payment_id_key UNIQUE (payment_id)
);

CREATE TABLE public.lawyer_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lawyer_holidays_lawyer_date_key UNIQUE (lawyer_id, date)
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

-- --------------------------------------------------
-- Indexes and booking constraints
-- --------------------------------------------------

CREATE INDEX idx_user_roles_role_active
    ON public.user_roles (role, is_active);
CREATE INDEX idx_lawyer_services_service_id
    ON public.lawyer_services (service_id);
CREATE INDEX idx_availability_lawyer_day
    ON public.availability (lawyer_id, day_of_week);
CREATE INDEX idx_consultations_service_id
    ON public.consultations (service_id);
CREATE INDEX idx_consultations_date_status
    ON public.consultations (date, status);
CREATE INDEX idx_lawyer_holidays_date
    ON public.lawyer_holidays (date);
CREATE INDEX idx_gallery_images_sort_order
    ON public.gallery_images (sort_order, created_at);
CREATE INDEX idx_testimonials_published_order
    ON public.testimonials (is_published, sort_order, created_at);
CREATE INDEX idx_faqs_published_order
    ON public.faqs (is_published, sort_order, created_at);
CREATE UNIQUE INDEX lawyers_one_featured_hero_idx
    ON public.lawyers (is_featured_hero)
    WHERE is_featured_hero = true;
CREATE UNIQUE INDEX gallery_images_one_hero_idx
    ON public.gallery_images (is_hero_image)
    WHERE is_hero_image = true;

CREATE UNIQUE INDEX unique_active_consultation
    ON public.consultations (lawyer_id, date, time_slot)
    WHERE status <> 'cancelled';

-- --------------------------------------------------
-- Exclusive homepage hero selections
-- --------------------------------------------------

CREATE FUNCTION public.enforce_single_featured_hero_lawyer()
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

CREATE TRIGGER lawyers_single_featured_hero
BEFORE INSERT OR UPDATE OF is_featured_hero ON public.lawyers
FOR EACH ROW
WHEN (NEW.is_featured_hero = true)
EXECUTE FUNCTION public.enforce_single_featured_hero_lawyer();

CREATE TRIGGER gallery_images_single_hero
BEFORE INSERT OR UPDATE OF is_hero_image ON public.gallery_images
FOR EACH ROW
WHEN (NEW.is_hero_image = true)
EXECUTE FUNCTION public.enforce_single_hero_gallery_image();

-- --------------------------------------------------
-- Privacy-safe public consultation availability
-- --------------------------------------------------

CREATE VIEW public.public_consultations
WITH (security_barrier = true)
AS
SELECT
    id,
    lawyer_id,
    date,
    time_slot,
    status
FROM public.consultations
WHERE status <> 'cancelled';

CREATE VIEW public.public_bookings
WITH (security_barrier = true)
AS
SELECT
    id,
    lawyer_id,
    lawyer_id AS doctor_id,
    date,
    time_slot,
    status
FROM public.consultations
WHERE status <> 'cancelled';

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

CREATE FUNCTION public.current_lawyer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT lawyer_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'lawyer'
      AND is_active = true
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_lawyer_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_lawyer_id() TO authenticated;

-- --------------------------------------------------
-- Row Level Security
-- --------------------------------------------------

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_admin_all
ON public.user_roles
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY user_roles_select_active_own
ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY lawyers_public_select
ON public.lawyers
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY lawyers_admin_all
ON public.lawyers
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY legal_services_public_select
ON public.legal_services
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY legal_services_admin_all
ON public.legal_services
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY lawyer_services_public_select
ON public.lawyer_services
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY lawyer_services_admin_all
ON public.lawyer_services
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

CREATE POLICY consultations_admin_all
ON public.consultations
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY consultations_staff_select
ON public.consultations
FOR SELECT TO authenticated
USING (public.has_role('staff'));

CREATE POLICY consultations_staff_update
ON public.consultations
FOR UPDATE TO authenticated
USING (public.has_role('staff'))
WITH CHECK (public.has_role('staff'));

CREATE POLICY consultations_lawyer_select_own
ON public.consultations
FOR SELECT TO authenticated
USING (lawyer_id = public.current_lawyer_id());

CREATE POLICY lawyer_holidays_public_select
ON public.lawyer_holidays
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY lawyer_holidays_admin_all
ON public.lawyer_holidays
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

GRANT SELECT ON public.lawyers TO anon, authenticated;
GRANT SELECT ON public.legal_services TO anon, authenticated;
GRANT SELECT ON public.lawyer_services TO anon, authenticated;
GRANT SELECT ON public.availability TO anon, authenticated;
GRANT SELECT ON public.lawyer_holidays TO anon, authenticated;
GRANT SELECT ON public.gallery_images TO anon, authenticated;
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT SELECT ON public.public_consultations TO anon, authenticated;
GRANT SELECT ON public.public_bookings TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lawyers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.legal_services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lawyer_services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lawyer_holidays TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;

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
        'lawyer-images',
        'lawyer-images',
        true,
        5242880,
        ARRAY['image/png', 'image/jpeg', 'image/webp']
    ),
    (
        'firm-gallery',
        'firm-gallery',
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

CREATE POLICY lawyer_images_public_select
ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'lawyer-images');

CREATE POLICY lawyer_images_admin_all
ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'lawyer-images' AND public.is_admin())
WITH CHECK (bucket_id = 'lawyer-images' AND public.is_admin());

CREATE POLICY firm_gallery_public_select
ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'firm-gallery');

CREATE POLICY firm_gallery_admin_all
ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'firm-gallery' AND public.is_admin())
WITH CHECK (bucket_id = 'firm-gallery' AND public.is_admin());

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

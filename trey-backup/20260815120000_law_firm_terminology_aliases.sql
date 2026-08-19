-- Law-firm terminology migration
--
-- This migration converts the backend-only RBAC column to lawyer terminology
-- and adds legal alias views for the app-facing medical-era tables.
-- Core app tables remain in place for compatibility until the frontend is
-- migrated in a separate pass.

BEGIN;

-- --------------------------------------------------
-- Backend-only RBAC column rename
-- --------------------------------------------------

ALTER TABLE public.user_roles
    RENAME COLUMN doctor_id TO lawyer_id;

ALTER TABLE public.user_roles
    RENAME CONSTRAINT user_roles_doctor_id_key TO user_roles_lawyer_id_key;

ALTER TABLE public.user_roles
    RENAME CONSTRAINT user_roles_doctor_link_check TO user_roles_lawyer_link_check;

COMMENT ON COLUMN public.user_roles.lawyer_id IS
    'Linked lawyer profile for internal RBAC. Legacy doctor_id references are preserved only through compatibility helpers.';

CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT lawyer_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'doctor'
      AND is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_lawyer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.current_doctor_id();
$$;

REVOKE ALL ON FUNCTION public.current_doctor_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_lawyer_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_doctor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_lawyer_id() TO authenticated;

DROP POLICY IF EXISTS appointments_doctor_select_own ON public.appointments;
DROP POLICY IF EXISTS doctor_select_own ON public.appointments;
DROP POLICY IF EXISTS appointments_lawyer_select_own ON public.appointments;

CREATE POLICY appointments_lawyer_select_own
ON public.appointments
FOR SELECT TO authenticated
USING (doctor_id = public.current_lawyer_id());

-- --------------------------------------------------
-- Compatibility comments on legacy physical tables
-- --------------------------------------------------

COMMENT ON TABLE public.doctors IS
    'Legacy compatibility table for lawyer profiles. Prefer public.lawyers for law-firm terminology.';
COMMENT ON TABLE public.doctor_services IS
    'Legacy compatibility join table for lawyer-service mappings. Prefer public.lawyer_services.';
COMMENT ON TABLE public.doctor_holidays IS
    'Legacy compatibility table for lawyer availability exceptions. Prefer public.lawyer_holidays.';
COMMENT ON TABLE public.availability IS
    'Legacy compatibility scheduling table. Prefer public.lawyer_availability for law-firm terminology.';
COMMENT ON TABLE public.appointments IS
    'Consultations are stored here for compatibility. Prefer public.consultations for law-firm terminology.';
COMMENT ON TABLE public.services IS
    'Legal services catalog.';
COMMENT ON TABLE public.testimonials IS
    'Client testimonials and client stories.';

-- --------------------------------------------------
-- Legal alias views
-- --------------------------------------------------

CREATE OR REPLACE VIEW public.lawyers
WITH (security_barrier = true)
AS
SELECT
    id,
    name,
    specialization,
    experience,
    photo,
    bio,
    is_featured_hero,
    created_at
FROM public.doctors;

COMMENT ON VIEW public.lawyers IS
    'Legal alias for the practitioner catalog. The underlying doctors table remains for app compatibility.';

CREATE OR REPLACE VIEW public.legal_services
WITH (security_barrier = true)
AS
SELECT
    id,
    name,
    description,
    price,
    currency,
    image_url,
    created_at
FROM public.services;

COMMENT ON VIEW public.legal_services IS
    'Legal alias for the services catalog.';

CREATE OR REPLACE VIEW public.lawyer_services
WITH (security_barrier = true)
AS
SELECT
    doctor_id AS lawyer_id,
    service_id,
    created_at
FROM public.doctor_services;

COMMENT ON VIEW public.lawyer_services IS
    'Legal alias for the practitioner-service mapping table.';

CREATE OR REPLACE VIEW public.lawyer_availability
WITH (security_barrier = true)
AS
SELECT
    id,
    doctor_id AS lawyer_id,
    day_of_week,
    start_time,
    end_time,
    slot_duration_minutes,
    created_at
FROM public.availability;

COMMENT ON VIEW public.lawyer_availability IS
    'Legal alias for weekly lawyer availability windows.';

CREATE OR REPLACE VIEW public.lawyer_holidays
WITH (security_barrier = true)
AS
SELECT
    id,
    doctor_id AS lawyer_id,
    date,
    created_at
FROM public.doctor_holidays;

COMMENT ON VIEW public.lawyer_holidays IS
    'Legal alias for lawyer availability exceptions.';

CREATE OR REPLACE VIEW public.consultations
WITH (security_barrier = true)
AS
SELECT
    id,
    doctor_id AS lawyer_id,
    service_id,
    date,
    time_slot,
    patient_name AS client_name,
    patient_phone AS client_phone,
    patient_email AS client_email,
    status,
    payment_status,
    payment_id,
    order_id,
    created_at
FROM public.appointments;

COMMENT ON VIEW public.consultations IS
    'Legal alias for booked consultations. The underlying appointments table remains unchanged for compatibility.';

CREATE OR REPLACE VIEW public.public_consultations
WITH (security_barrier = true)
AS
SELECT
    id,
    doctor_id AS lawyer_id,
    date,
    time_slot,
    status
FROM public.appointments
WHERE status <> 'cancelled';

COMMENT ON VIEW public.public_consultations IS
    'Public slot occupancy view that exposes only non-sensitive consultation metadata.';

CREATE OR REPLACE VIEW public.client_testimonials
WITH (security_barrier = true)
AS
SELECT
    id,
    patient_name AS client_name,
    patient_label AS client_label,
    review,
    rating,
    image_url,
    sort_order,
    is_published,
    created_at,
    updated_at
FROM public.testimonials;

COMMENT ON VIEW public.client_testimonials IS
    'Legal alias for client-facing testimonials.';

GRANT SELECT ON public.lawyers TO anon, authenticated;
GRANT SELECT ON public.legal_services TO anon, authenticated;
GRANT SELECT ON public.lawyer_services TO anon, authenticated;
GRANT SELECT ON public.lawyer_availability TO anon, authenticated;
GRANT SELECT ON public.lawyer_holidays TO anon, authenticated;
GRANT SELECT ON public.consultations TO anon, authenticated;
GRANT SELECT ON public.public_consultations TO anon, authenticated;
GRANT SELECT ON public.client_testimonials TO anon, authenticated;

-- --------------------------------------------------
-- Content cleanup
-- --------------------------------------------------

UPDATE public.faqs
SET answer = replace(
    replace(answer, 'attorneys', 'lawyers'),
    'attorney',
    'lawyer'
)
WHERE answer ILIKE '%attorney%';

COMMIT;

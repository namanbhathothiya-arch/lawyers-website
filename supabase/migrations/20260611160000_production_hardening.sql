-- Production hardening migration for existing Advanced Care Hub databases.
-- Run after the original schema has been applied.

ALTER TABLE public.user_roles
    ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
    DROP CONSTRAINT IF EXISTS appointments_status_check,
    ADD CONSTRAINT appointments_status_check
        CHECK (status IN ('pending_payment', 'booked', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'));

ALTER TABLE public.appointments
    DROP CONSTRAINT IF EXISTS appointments_payment_status_check,
    ADD CONSTRAINT appointments_payment_status_check
        CHECK (payment_status IN ('pending', 'paid', 'refund_pending', 'refunded', 'failed'));

CREATE OR REPLACE FUNCTION public.has_role(check_role TEXT)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

DROP POLICY IF EXISTS staff_manage ON public.appointments;
DROP POLICY IF EXISTS staff_update ON public.appointments;
DROP POLICY IF EXISTS doctor_select_own ON public.appointments;

CREATE POLICY staff_manage ON public.appointments
    FOR SELECT TO authenticated USING (public.has_role('staff'));

CREATE POLICY staff_update ON public.appointments
    FOR UPDATE TO authenticated USING (public.has_role('staff')) WITH CHECK (public.has_role('staff'));

CREATE POLICY doctor_select_own ON public.appointments
    FOR SELECT TO authenticated USING (doctor_id = public.current_doctor_id());

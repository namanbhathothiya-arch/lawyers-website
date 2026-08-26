-- 20260825220000_fix_legacy_doctor_policies.sql
-- Fix column "doctor_id" does not exist error by dropping legacy doctor policies on consultations and related tables.

BEGIN;

-- Drop leftover legacy policies from appointments/doctors schema
DROP POLICY IF EXISTS doctor_select_own ON public.consultations;
DROP POLICY IF EXISTS staff_manage ON public.consultations;
DROP POLICY IF EXISTS doctor_select ON public.consultations;
DROP POLICY IF EXISTS appointments_doctor_select ON public.consultations;
DROP POLICY IF EXISTS appointments_admin_all ON public.consultations;
DROP POLICY IF EXISTS appointments_staff_select ON public.consultations;
DROP POLICY IF EXISTS appointments_public_insert ON public.consultations;

-- Drop legacy policies on other tables if present
DROP POLICY IF EXISTS doctor_select_own ON public.availability;
DROP POLICY IF EXISTS doctor_select_own ON public.lawyer_services;
DROP POLICY IF EXISTS doctor_select_own ON public.lawyer_holidays;
DROP POLICY IF EXISTS doctor_select_own ON public.user_roles;

-- Ensure correct lawyer RLS policies on consultations
DROP POLICY IF EXISTS admin_all ON public.consultations;
DROP POLICY IF EXISTS staff_select ON public.consultations;
DROP POLICY IF EXISTS staff_update ON public.consultations;
DROP POLICY IF EXISTS lawyer_select_own ON public.consultations;
DROP POLICY IF EXISTS public_insert ON public.consultations;

CREATE POLICY admin_all ON public.consultations FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY staff_select ON public.consultations FOR SELECT TO authenticated USING (public.has_role('staff'));
CREATE POLICY staff_update ON public.consultations FOR UPDATE TO authenticated USING (public.has_role('staff')) WITH CHECK (public.has_role('staff'));
CREATE POLICY lawyer_select_own ON public.consultations FOR SELECT TO authenticated USING (lawyer_id = public.current_lawyer_id());
CREATE POLICY public_insert ON public.consultations FOR INSERT TO anon, authenticated WITH CHECK (true);

COMMIT;

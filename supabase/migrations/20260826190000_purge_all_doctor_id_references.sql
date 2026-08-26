-- 20260826190000_purge_all_doctor_id_references.sql
-- Exhaustively remove every remaining policy/trigger/function reference
-- to doctor_id on consultations and related tables.
-- All RLS policies recreated using lawyer_id only.

BEGIN;

-- 1. DROP ALL POLICIES on public.consultations (dynamic — catches any name)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'consultations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.consultations', pol.policyname);
        RAISE NOTICE 'Dropped consultations policy: %', pol.policyname;
    END LOOP;
END $$;

-- 2. DROP ALL POLICIES on public.availability
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='availability'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.availability', pol.policyname); END LOOP;
END $$;

-- 3. DROP ALL POLICIES on public.lawyer_services
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='lawyer_services'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.lawyer_services', pol.policyname); END LOOP;
END $$;

-- 4. DROP ALL POLICIES on public.lawyer_holidays
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='lawyer_holidays'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.lawyer_holidays', pol.policyname); END LOOP;
END $$;

-- 5. DROP ALL POLICIES on public.user_roles
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_roles'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname); END LOOP;
END $$;

-- 6. Replace legacy current_doctor_id() with a safe stub (delegates to current_lawyer_id)
CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS uuid AS $$
BEGIN
    RETURN public.current_lawyer_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure RLS is enabled
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;

-- 8. Recreate consultations policies (lawyer_id only)
CREATE POLICY admin_all ON public.consultations FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY staff_select ON public.consultations FOR SELECT TO authenticated USING (public.has_role('staff'));
CREATE POLICY staff_update ON public.consultations FOR UPDATE TO authenticated USING (public.has_role('staff')) WITH CHECK (public.has_role('staff'));
CREATE POLICY lawyer_select_own ON public.consultations FOR SELECT TO authenticated USING (lawyer_id = public.current_lawyer_id());
CREATE POLICY public_insert ON public.consultations FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 9. Recreate availability policies
CREATE POLICY admin_all ON public.availability FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.availability FOR SELECT TO anon, authenticated USING (true);

-- 10. Recreate lawyer_services policies
CREATE POLICY admin_all ON public.lawyer_services FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyer_services FOR SELECT TO anon, authenticated USING (true);

-- 11. Recreate lawyer_holidays policies
CREATE POLICY admin_all ON public.lawyer_holidays FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyer_holidays FOR SELECT TO anon, authenticated USING (true);

-- 12. Recreate user_roles policies
CREATE POLICY admin_all ON public.user_roles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY self_select ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 13. Recreate lawyers policies (idempotent)
DROP POLICY IF EXISTS admin_all ON public.lawyers;
DROP POLICY IF EXISTS public_select ON public.lawyers;
CREATE POLICY admin_all ON public.lawyers FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.lawyers FOR SELECT TO anon, authenticated USING (true);

-- 14. Recreate legal_services policies (idempotent)
DROP POLICY IF EXISTS admin_all ON public.legal_services;
DROP POLICY IF EXISTS public_select ON public.legal_services;
CREATE POLICY admin_all ON public.legal_services FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY public_select ON public.legal_services FOR SELECT TO anon, authenticated USING (true);

-- 15. Grants
GRANT SELECT ON public.consultations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;

COMMIT;

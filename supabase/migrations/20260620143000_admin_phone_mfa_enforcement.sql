BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
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
          AND role = 'admin'
          AND is_active = true
          AND COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    );
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;

BEGIN;

DROP TRIGGER IF EXISTS sync_admin_phone_to_auth ON public.user_roles;
DROP FUNCTION IF EXISTS public.sync_admin_phone_to_auth();
DROP FUNCTION IF EXISTS public.begin_admin_phone_verification();
DROP FUNCTION IF EXISTS public.complete_admin_phone_verification(UUID);
DROP TABLE IF EXISTS public.admin_phone_challenges CASCADE;
DROP TABLE IF EXISTS public.admin_verified_sessions CASCADE;

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

NOTIFY pgrst, 'reload schema';

COMMIT;

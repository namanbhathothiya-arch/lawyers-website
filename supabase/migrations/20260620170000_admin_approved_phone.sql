BEGIN;

ALTER TABLE public.user_roles
    ADD COLUMN IF NOT EXISTS admin_phone TEXT;

ALTER TABLE public.user_roles
    DROP CONSTRAINT IF EXISTS user_roles_admin_phone_format_check;

ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_admin_phone_format_check
    CHECK (
        admin_phone IS NULL
        OR admin_phone ~ '^\+[1-9][0-9]{7,14}$'
    );

UPDATE public.user_roles
SET admin_phone = '+917597677713'
WHERE role = 'admin'
  AND user_id = (
      SELECT id
      FROM auth.users
      WHERE lower(email) = lower('nk6225003@gmail.com')
      LIMIT 1
  );

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
          AND roles.admin_phone IS NOT NULL
          AND COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
          AND EXISTS (
              SELECT 1
              FROM auth.mfa_factors AS factors
              WHERE factors.user_id = roles.user_id
                AND factors.factor_type = 'phone'
                AND factors.status = 'verified'
                AND factors.phone = roles.admin_phone
          )
    );
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;

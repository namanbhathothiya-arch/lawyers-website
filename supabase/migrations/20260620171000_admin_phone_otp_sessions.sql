BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_phone_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_phone_challenges_user_created_idx
    ON public.admin_phone_challenges (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_verified_sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '12 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_verified_sessions_user_idx
    ON public.admin_verified_sessions (user_id, expires_at);

ALTER TABLE public.admin_phone_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_verified_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_phone_challenges FROM anon, authenticated;
REVOKE ALL ON public.admin_verified_sessions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.begin_admin_phone_verification()
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    challenge_id UUID;
    used_password BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(auth.jwt() -> 'amr', '[]'::jsonb)) AS method
        WHERE method ->> 'method' = 'password'
    )
    INTO used_password;

    IF auth.uid() IS NULL OR NOT used_password OR NOT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
          AND is_active = true
          AND admin_phone IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Invalid credentials';
    END IF;

    DELETE FROM public.admin_phone_challenges
    WHERE user_id = auth.uid()
      AND (expires_at <= now() OR completed_at IS NOT NULL);

    INSERT INTO public.admin_phone_challenges (user_id)
    VALUES (auth.uid())
    RETURNING id INTO challenge_id;

    RETURN challenge_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_admin_phone_verification(challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    current_session_id UUID;
    used_phone_otp BOOLEAN;
BEGIN
    current_session_id := NULLIF(auth.jwt() ->> 'session_id', '')::UUID;

    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(auth.jwt() -> 'amr', '[]'::jsonb)) AS method
        WHERE method ->> 'method' = 'otp'
    )
    INTO used_phone_otp;

    IF auth.uid() IS NULL OR current_session_id IS NULL OR NOT used_phone_otp THEN
        RAISE EXCEPTION 'Invalid credentials';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.admin_phone_challenges AS challenges
        JOIN public.user_roles AS roles
          ON roles.user_id = challenges.user_id
        JOIN auth.users AS users
          ON users.id = challenges.user_id
        WHERE challenges.id = challenge_id
          AND challenges.user_id = auth.uid()
          AND challenges.completed_at IS NULL
          AND challenges.expires_at > now()
          AND roles.role = 'admin'
          AND roles.is_active = true
          AND roles.admin_phone IS NOT NULL
          AND users.phone_confirmed_at IS NOT NULL
          AND regexp_replace(COALESCE(users.phone, ''), '[^0-9]', '', 'g')
              = regexp_replace(roles.admin_phone, '[^0-9]', '', 'g')
    ) THEN
        RAISE EXCEPTION 'Invalid credentials';
    END IF;

    UPDATE public.admin_phone_challenges
    SET completed_at = now()
    WHERE id = challenge_id;

    INSERT INTO public.admin_verified_sessions (session_id, user_id)
    VALUES (current_session_id, auth.uid())
    ON CONFLICT (session_id) DO UPDATE
    SET
        user_id = EXCLUDED.user_id,
        expires_at = now() + interval '12 hours',
        created_at = now();

    RETURN true;
END;
$$;

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
        JOIN public.admin_verified_sessions AS verified
          ON verified.user_id = roles.user_id
        WHERE roles.user_id = auth.uid()
          AND roles.role = 'admin'
          AND roles.is_active = true
          AND roles.admin_phone IS NOT NULL
          AND verified.session_id = NULLIF(auth.jwt() ->> 'session_id', '')::UUID
          AND verified.expires_at > now()
    );
$$;

REVOKE ALL ON FUNCTION public.begin_admin_phone_verification() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_admin_phone_verification(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.begin_admin_phone_verification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_admin_phone_verification(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

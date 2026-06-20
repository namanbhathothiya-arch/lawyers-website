BEGIN;

CREATE OR REPLACE FUNCTION public.sync_admin_phone_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    normalized_phone TEXT := NULLIF(regexp_replace(COALESCE(NEW.admin_phone, ''), '[^0-9]', '', 'g'), '');
BEGIN
    IF NEW.role = 'admin' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE auth.users
            SET phone = normalized_phone,
                phone_confirmed_at = NULL
            WHERE id = NEW.user_id;
        ELSIF NEW.admin_phone IS DISTINCT FROM OLD.admin_phone
           OR NEW.role IS DISTINCT FROM OLD.role THEN
            UPDATE auth.users
            SET phone = normalized_phone,
                phone_confirmed_at = NULL
            WHERE id = NEW.user_id;
        END IF;
    END IF;

    IF NEW.role <> 'admin' AND TG_OP = 'UPDATE' AND OLD.role = 'admin' THEN
        UPDATE auth.users
        SET phone = NULL,
            phone_confirmed_at = NULL
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_admin_phone_to_auth ON public.user_roles;

CREATE TRIGGER sync_admin_phone_to_auth
AFTER INSERT OR UPDATE OF admin_phone, role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_phone_to_auth();

COMMIT;

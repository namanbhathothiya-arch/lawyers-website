-- Priority 2D: staff account enable/disable status.

ALTER TABLE public.user_roles
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.has_role(check_role TEXT)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = check_role
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

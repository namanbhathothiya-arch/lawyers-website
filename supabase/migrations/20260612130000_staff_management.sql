-- Staff account status management.

ALTER TABLE public.user_roles
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

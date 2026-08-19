BEGIN;

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    legal_matter TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'in_review', 'responded', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
    ON public.contact_messages (created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_messages_public_insert ON public.contact_messages;
CREATE POLICY contact_messages_public_insert
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS contact_messages_admin_all ON public.contact_messages;
CREATE POLICY contact_messages_admin_all
ON public.contact_messages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

REVOKE ALL ON public.contact_messages FROM anon, authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;

COMMENT ON TABLE public.contact_messages IS
    'Client contact and consultation requests submitted from the public website.';

NOTIFY pgrst, 'reload schema';

COMMIT;

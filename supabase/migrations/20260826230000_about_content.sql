-- ============================================================
-- About Content Table
-- Supabase project: smfcezjspteosqqrvubb (lawyers mock database)
-- VITE_SUPABASE_URL match: smfcezjspteosqqrvubb ✓ CLI linked: smfcezjspteosqqrvubb ✓
-- ============================================================

CREATE TABLE IF NOT EXISTS public.about_content (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_name            TEXT        NOT NULL DEFAULT '',
    eyebrow              TEXT        NOT NULL DEFAULT '',
    headline             TEXT        NOT NULL DEFAULT '',
    subheadline          TEXT        NOT NULL DEFAULT '',
    mission              TEXT        NOT NULL DEFAULT '',
    story                TEXT        NOT NULL DEFAULT '',
    approach             TEXT        NOT NULL DEFAULT '',
    confidentiality_note TEXT        NOT NULL DEFAULT '',
    consultation_note    TEXT        NOT NULL DEFAULT '',
    primary_cta_label    TEXT        NOT NULL DEFAULT 'Book a Consultation',
    primary_cta_url      TEXT        NOT NULL DEFAULT '/appointment',
    secondary_cta_label  TEXT        NOT NULL DEFAULT 'Meet Our Lawyers',
    secondary_cta_url    TEXT        NOT NULL DEFAULT '/doctors',
    hero_image_url       TEXT        NULL,
    is_published         BOOLEAN     NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick published fetch
CREATE INDEX IF NOT EXISTS idx_about_content_published
    ON public.about_content (is_published, updated_at DESC);

-- Auto-update updated_at via existing moddatetime extension if available,
-- otherwise we handle it in application code
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'moddatetime'
    ) THEN
        CREATE TRIGGER handle_about_content_updated_at
        BEFORE UPDATE ON public.about_content
        FOR EACH ROW
        EXECUTE PROCEDURE moddatetime(updated_at);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- ---- RLS ----
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

-- Public: read published records only
DROP POLICY IF EXISTS about_content_public_select ON public.about_content;
CREATE POLICY about_content_public_select
ON public.about_content
FOR SELECT
TO anon, authenticated
USING (is_published = true OR public.is_admin());

-- Admin: full write access
DROP POLICY IF EXISTS about_content_admin_all ON public.about_content;
CREATE POLICY about_content_admin_all
ON public.about_content
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Permissions
REVOKE ALL ON public.about_content FROM anon, authenticated;
GRANT SELECT ON public.about_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_content TO authenticated;

-- ============================================================
-- Seed: one published About record (safe / idempotent)
-- ============================================================
INSERT INTO public.about_content (
    firm_name,
    eyebrow,
    headline,
    subheadline,
    mission,
    story,
    approach,
    confidentiality_note,
    consultation_note,
    primary_cta_label,
    primary_cta_url,
    secondary_cta_label,
    secondary_cta_url,
    hero_image_url,
    is_published
)
SELECT
    'Our Firm',
    'ABOUT OUR FIRM',
    'Experienced counsel. Clear strategy. Trusted representation.',
    'A client-focused legal practice built around thoughtful advice, careful preparation, and direct communication.',
    'We help individuals, families, and businesses understand their legal position, evaluate their options, and move forward with confidence. Our commitment is to provide straightforward, practical legal guidance so that every client feels informed and supported at every stage of their matter.',
    E'Our practice was founded on the belief that every person deserves direct access to a qualified advocate who genuinely understands their circumstances. We work closely with clients across a range of civil, corporate, and general legal matters, combining careful statutory analysis with clear, honest communication.\n\nWe place particular emphasis on preparation. Before any consultation, filing, or hearing, we review the available documents and facts thoroughly so that the advice we give is grounded in what the law actually permits — not what clients hope to hear. This disciplined approach helps us identify risks early and plan practical paths forward.\n\nOur chambers maintain a structured yet approachable environment. Clients speak directly with the advocate handling their matter, receive clear written summaries of the advice given, and are kept informed of procedural developments without unnecessary delay. We believe informed clients make better decisions, and that is ultimately what serves them best.',
    E'Clear Advice: We explain your legal position in plain language, without unnecessary jargon, so you can make informed decisions.\n\nStrategic Preparation: Every matter receives careful document review and legal analysis before any step is taken.\n\nDirect Communication: You will speak with your advocate directly, not a junior representative, throughout your engagement.\n\nConfidential Representation: All communications and case details remain strictly privileged and protected.\n\nPractical Guidance: We focus on workable solutions that reflect your actual circumstances and objectives.',
    'All communications between clients and our advocates are protected by legal professional privilege. Information shared during a consultation or in the course of representation is treated as strictly confidential and will not be disclosed to any third party without your explicit consent, except as required by law.',
    'We welcome individuals, families, and businesses who wish to discuss their legal matter. To arrange a consultation with the appropriate advocate, please use our online booking system or contact the chambers directly. Early consultation often helps clarify options and avoid unnecessary complications.',
    'Book a Consultation',
    '/appointment',
    'Meet Our Lawyers',
    '/doctors',
    NULL,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.about_content LIMIT 1
);

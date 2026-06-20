CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL CHECK (char_length(question) <= 1000),
    answer TEXT NOT NULL CHECK (char_length(answer) <= 2000),
    category TEXT CHECK (category IS NULL OR char_length(category) <= 80),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_published_order
    ON public.faqs (is_published, sort_order, created_at);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS faqs_public_select ON public.faqs;
CREATE POLICY faqs_public_select
ON public.faqs
FOR SELECT
TO anon, authenticated
USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS faqs_admin_all ON public.faqs;
CREATE POLICY faqs_admin_all
ON public.faqs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

REVOKE ALL ON public.faqs FROM anon, authenticated;
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'How do I book an appointment?',
    'You can book online through the appointment page or call the clinic directly. After choosing a service, doctor, date, and available time slot, we will confirm your booking details.',
    'Appointments',
    0,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'How do I book an appointment?'
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'What should I bring for my first visit?',
    'Please bring previous prescriptions, investigation reports, current medications, and any discharge summaries if available. This helps the doctor understand your health history clearly.',
    'Visit preparation',
    1,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'What should I bring for my first visit?'
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'Are service prices transparent?',
    'Yes. Service prices are shown before booking wherever available. If a service needs additional tests or procedures, the care team will explain those costs before proceeding.',
    'Billing',
    2,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'Are service prices transparent?'
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'Is follow-up support included?',
    'Most consultations include a clear follow-up plan. The doctor will explain when you should return, whether further tests are needed, and how to continue your treatment safely.',
    'After care',
    3,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'Is follow-up support included?'
);

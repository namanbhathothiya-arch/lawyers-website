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

BEGIN;

UPDATE public.faqs
SET
    question = 'How do I book a consultation?',
    answer = 'You can book online through the consultation page or call the office directly. After choosing a practice area, attorney, date, and available time slot, we will confirm your booking details.',
    category = 'Consultations',
    sort_order = 0,
    is_published = true
WHERE question = 'How do I book an appointment?';

UPDATE public.faqs
SET
    question = 'What should I bring to my first consultation?',
    answer = 'Please bring any contracts, letters, notices, court papers, or other relevant documents if available. This helps the attorney understand the matter clearly.',
    category = 'Preparation',
    sort_order = 1,
    is_published = true
WHERE question = 'What should I bring for my first visit?';

UPDATE public.faqs
SET
    question = 'How are legal fees determined?',
    answer = 'Fees depend on the type of matter, the amount of work involved, and whether the matter is handled on a consultation, hourly, flat-fee, or other basis. The office can discuss the available structure before work begins.',
    category = 'Fees',
    sort_order = 2,
    is_published = true
WHERE question = 'Are service prices transparent?';

UPDATE public.faqs
SET
    question = 'What happens after the initial consultation?',
    answer = 'The attorney will usually outline the next steps, any documents that are needed, and whether the matter can proceed further. No outcome is guaranteed, and the next step depends on the facts of the matter.',
    category = 'Follow-up',
    sort_order = 3,
    is_published = true
WHERE question = 'Is follow-up support included?';

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'Is my consultation confidential?',
    'The office treats client communications with care and discretion. Any specific confidentiality expectations should be confirmed directly with the attorney during your consultation.',
    'Confidentiality',
    4,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'Is my consultation confidential?'
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'Do you offer virtual consultations?',
    'Virtual consultations may be available depending on the matter and the attorney''s schedule. Please check with the office when booking.',
    'Consultations',
    5,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'Do you offer virtual consultations?'
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_published)
SELECT
    'How long does a consultation take?',
    'Consultation length depends on the matter, the documents provided, and the questions that need to be covered. If you need more time, the office can explain the available options.',
    'Consultations',
    6,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.faqs WHERE question = 'How long does a consultation take?'
);

NOTIFY pgrst, 'reload schema';

COMMIT;

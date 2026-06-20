ALTER TABLE public.faqs
    DROP CONSTRAINT IF EXISTS faqs_question_check,
    DROP CONSTRAINT IF EXISTS faqs_answer_check,
    ADD CONSTRAINT faqs_question_check CHECK (char_length(question) <= 1000),
    ADD CONSTRAINT faqs_answer_check CHECK (char_length(answer) <= 2000);

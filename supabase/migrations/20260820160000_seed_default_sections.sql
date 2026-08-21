-- Seed standard Service Sections if none exist in production.

INSERT INTO public.service_sections (
    id,
    name,
    slug,
    description,
    display_order,
    is_published
)
VALUES
    (gen_random_uuid(), 'Property Law', 'property-law', 'Property-related legal matters, transactions, disputes and documentation.', 1, true),
    (gen_random_uuid(), 'Criminal Law', 'criminal-law', 'Criminal litigation, defense, bail and appeals.', 2, true),
    (gen_random_uuid(), 'Civil Law', 'civil-law', 'Civil disputes, litigation and related proceedings.', 3, true),
    (gen_random_uuid(), 'Family Law', 'family-law', 'Divorce, custody and matrimonial matters.', 4, true),
    (gen_random_uuid(), 'Corporate Law', 'corporate-law', 'Business, company and commercial matters.', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Auto-link unassigned legal_services to Civil Law if section_id is null
UPDATE public.legal_services
SET section_id = (SELECT id FROM public.service_sections WHERE slug = 'civil-law' LIMIT 1)
WHERE section_id IS NULL;

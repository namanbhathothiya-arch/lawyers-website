-- Add a two-level legal services hierarchy without dropping existing services or lawyer mappings.

BEGIN;

CREATE OR REPLACE FUNCTION public.slugify_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(
      regexp_replace(
        regexp_replace(lower(COALESCE(input_text, '')), '&', ' and ', 'g'),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '-'
    ),
    'item'
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.service_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_sections
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'service_sections_slug_key'
          AND conrelid = 'public.service_sections'::regclass
    ) THEN
        ALTER TABLE public.service_sections ADD CONSTRAINT service_sections_slug_key UNIQUE (slug);
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_service_sections_published_order
    ON public.service_sections (is_published, display_order, created_at);

CREATE INDEX IF NOT EXISTS idx_service_sections_slug
    ON public.service_sections (slug);

CREATE OR REPLACE FUNCTION public.ensure_unique_service_section_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    candidate TEXT;
    suffix INTEGER := 0;
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := gen_random_uuid();
    END IF;

    base_slug := public.slugify_text(COALESCE(NULLIF(NEW.slug, ''), NEW.name));
    candidate := base_slug;

    LOOP
        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM public.service_sections ss
            WHERE ss.slug = candidate
              AND ss.id <> NEW.id
        )
        AND NOT EXISTS (
            SELECT 1
            FROM public.legal_services ls
            WHERE ls.slug = candidate
        );

        suffix := suffix + 1;
        candidate := base_slug || '-' || left(replace(NEW.id::text, '-', ''), 8);
        IF suffix > 1 THEN
            candidate := candidate || '-' || suffix::text;
        END IF;
    END LOOP;

    NEW.slug := candidate;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_sections_slug_trigger ON public.service_sections;
CREATE TRIGGER service_sections_slug_trigger
BEFORE INSERT OR UPDATE OF name, slug ON public.service_sections
FOR EACH ROW
EXECUTE FUNCTION public.ensure_unique_service_section_slug();

DROP TRIGGER IF EXISTS service_sections_touch_updated_at_trigger ON public.service_sections;
CREATE TRIGGER service_sections_touch_updated_at_trigger
BEFORE UPDATE ON public.service_sections
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.legal_services
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS section_id UUID,
    ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS how_we_help TEXT,
    ADD COLUMN IF NOT EXISTS important_information TEXT,
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'legal_services_section_id_fkey'
          AND conrelid = 'public.legal_services'::regclass
    ) THEN
        ALTER TABLE public.legal_services
            ADD CONSTRAINT legal_services_section_id_fkey
            FOREIGN KEY (section_id)
            REFERENCES public.service_sections(id)
            ON DELETE RESTRICT;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_legal_services_section_id
    ON public.legal_services (section_id);

CREATE INDEX IF NOT EXISTS idx_legal_services_published_order
    ON public.legal_services (is_published, display_order, created_at);

CREATE INDEX IF NOT EXISTS idx_legal_services_slug
    ON public.legal_services (slug);

CREATE OR REPLACE FUNCTION public.ensure_unique_legal_service_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    candidate TEXT;
    suffix INTEGER := 0;
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := gen_random_uuid();
    END IF;

    base_slug := public.slugify_text(COALESCE(NULLIF(NEW.slug, ''), NEW.name));
    candidate := base_slug;

    LOOP
        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM public.legal_services ls
            WHERE ls.slug = candidate
              AND ls.id <> NEW.id
        )
        AND NOT EXISTS (
            SELECT 1
            FROM public.service_sections ss
            WHERE ss.slug = candidate
        );

        suffix := suffix + 1;
        candidate := base_slug || '-' || left(replace(NEW.id::text, '-', ''), 8);
        IF suffix > 1 THEN
            candidate := candidate || '-' || suffix::text;
        END IF;
    END LOOP;

    NEW.slug := candidate;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS legal_services_slug_trigger ON public.legal_services;
CREATE TRIGGER legal_services_slug_trigger
BEFORE INSERT OR UPDATE OF name, slug ON public.legal_services
FOR EACH ROW
EXECUTE FUNCTION public.ensure_unique_legal_service_slug();

DROP TRIGGER IF EXISTS legal_services_touch_updated_at_trigger ON public.legal_services;
CREATE TRIGGER legal_services_touch_updated_at_trigger
BEFORE UPDATE ON public.legal_services
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.service_section_name_for_service(
    service_name text,
    service_description text
)
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
        WHEN lower(coalesce(service_name, '') || ' ' || coalesce(service_description, ''))
            ~ '(property|real estate|land|housing|title|mutation|deed|registration|sale|purchase|possession)'
            THEN 'Property Law'
        WHEN lower(coalesce(service_name, '') || ' ' || coalesce(service_description, ''))
            ~ '(criminal|bail|fir|complaint|prosecution|defenc|defens|appeal|arrest|investigation)'
            THEN 'Criminal Law'
        WHEN lower(coalesce(service_name, '') || ' ' || coalesce(service_description, ''))
            ~ '(family|divorce|custody|matrimonial|marriage|maintenance|alimony)'
            THEN 'Family Law'
        WHEN lower(coalesce(service_name, '') || ' ' || coalesce(service_description, ''))
            ~ '(corporate|business|company|commercial|merger|acquisition|contract|compliance|partnership|llp)'
            THEN 'Corporate Law'
        WHEN lower(coalesce(service_name, '') || ' ' || coalesce(service_description, ''))
            ~ '(civil|litigation|dispute|arbitration|consumer|injunction|recovery|notice)'
            THEN 'Civil Law'
        ELSE NULL
    END;
$$;

WITH inferred_sections AS (
    SELECT DISTINCT
        public.service_section_name_for_service(name, description) AS section_name
    FROM public.legal_services
    WHERE public.service_section_name_for_service(name, description) IS NOT NULL
)
INSERT INTO public.service_sections (
    id,
    name,
    slug,
    description,
    display_order,
    is_published,
    archived_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    inferred_sections.section_name,
    public.slugify_text(inferred_sections.section_name),
    CASE inferred_sections.section_name
        WHEN 'Property Law' THEN 'Property-related legal matters, transactions, disputes and documentation.'
        WHEN 'Criminal Law' THEN 'Criminal litigation, defense, bail and appeals.'
        WHEN 'Civil Law' THEN 'Civil disputes, litigation and related proceedings.'
        WHEN 'Family Law' THEN 'Divorce, custody and matrimonial matters.'
        WHEN 'Corporate Law' THEN 'Business, company and commercial matters.'
        ELSE NULL
    END,
    CASE inferred_sections.section_name
        WHEN 'Property Law' THEN 1
        WHEN 'Criminal Law' THEN 2
        WHEN 'Civil Law' THEN 3
        WHEN 'Family Law' THEN 4
        WHEN 'Corporate Law' THEN 5
        ELSE 99
    END,
    true,
    NULL,
    now(),
    now()
FROM inferred_sections
ON CONFLICT (slug) DO UPDATE
SET description = COALESCE(public.service_sections.description, EXCLUDED.description);

UPDATE public.legal_services ls
SET section_id = ss.id
FROM public.service_sections ss
WHERE ss.name = public.service_section_name_for_service(ls.name, ls.description)
  AND public.service_section_name_for_service(ls.name, ls.description) IS NOT NULL;

UPDATE public.service_sections
SET slug = COALESCE(NULLIF(slug, ''), name);

UPDATE public.legal_services
SET slug = COALESCE(NULLIF(slug, ''), name);

ALTER TABLE public.service_sections
    ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.legal_services
    ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.service_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_select ON public.service_sections;
DROP POLICY IF EXISTS admin_all ON public.service_sections;
DROP POLICY IF EXISTS service_sections_public_select ON public.service_sections;
DROP POLICY IF EXISTS service_sections_admin_all ON public.service_sections;

CREATE POLICY service_sections_public_select
ON public.service_sections
FOR SELECT TO anon, authenticated
USING (is_published = true AND archived_at IS NULL);

CREATE POLICY service_sections_admin_all
ON public.service_sections
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS public_select ON public.legal_services;
DROP POLICY IF EXISTS admin_all ON public.legal_services;
DROP POLICY IF EXISTS legal_services_public_select ON public.legal_services;
DROP POLICY IF EXISTS legal_services_admin_all ON public.legal_services;

CREATE POLICY legal_services_public_select
ON public.legal_services
FOR SELECT TO anon, authenticated
USING (is_published = true AND archived_at IS NULL);

CREATE POLICY legal_services_admin_all
ON public.legal_services
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT ON public.service_sections TO anon, authenticated;
GRANT SELECT ON public.legal_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_sections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.legal_services TO authenticated;

COMMIT;

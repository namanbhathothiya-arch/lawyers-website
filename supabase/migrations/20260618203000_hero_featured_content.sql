-- CMS-managed homepage hero selections.
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS is_featured_hero BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.gallery_images
ADD COLUMN IF NOT EXISTS is_hero_image BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.enforce_single_featured_hero_doctor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_featured_hero THEN
        UPDATE public.doctors
        SET is_featured_hero = false
        WHERE id <> NEW.id
          AND is_featured_hero = true;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_single_hero_gallery_image()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_hero_image THEN
        UPDATE public.gallery_images
        SET is_hero_image = false
        WHERE id <> NEW.id
          AND is_hero_image = true;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_single_featured_hero ON public.doctors;
CREATE TRIGGER doctors_single_featured_hero
BEFORE INSERT OR UPDATE OF is_featured_hero ON public.doctors
FOR EACH ROW
WHEN (NEW.is_featured_hero = true)
EXECUTE FUNCTION public.enforce_single_featured_hero_doctor();

DROP TRIGGER IF EXISTS gallery_images_single_hero ON public.gallery_images;
CREATE TRIGGER gallery_images_single_hero
BEFORE INSERT OR UPDATE OF is_hero_image ON public.gallery_images
FOR EACH ROW
WHEN (NEW.is_hero_image = true)
EXECUTE FUNCTION public.enforce_single_hero_gallery_image();

CREATE UNIQUE INDEX IF NOT EXISTS doctors_one_featured_hero_idx
ON public.doctors (is_featured_hero)
WHERE is_featured_hero = true;

CREATE UNIQUE INDEX IF NOT EXISTS gallery_images_one_hero_idx
ON public.gallery_images (is_hero_image)
WHERE is_hero_image = true;


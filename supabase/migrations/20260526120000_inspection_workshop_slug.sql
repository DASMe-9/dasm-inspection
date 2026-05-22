-- Step 26: public workshop profile URLs (/workshops/[slug])

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
  ) THEN
    RAISE NOTICE 'inspection_workshops missing — skip slug migration';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN slug text;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.inspection_slugify_workshop(p_name text, p_id uuid)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text;
  suffix text;
BEGIN
  s := lower(trim(coalesce(p_name, '')));
  s := regexp_replace(s, '[^a-zA-Z0-9]+', '-', 'g');
  s := regexp_replace(s, '-{2,}', '-', 'g');
  s := trim(both '-' from s);
  IF s = '' OR length(s) < 2 THEN
    s := 'workshop';
  END IF;
  suffix := left(replace(p_id::text, '-', ''), 8);
  RETURN substr(s, 1, 48) || '-' || suffix;
END;
$$;

DO $$
DECLARE
  r record;
  candidate text;
  n int;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'slug'
  ) THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT id, name
    FROM public.inspection_workshops
    WHERE slug IS NULL OR trim(slug) = ''
  LOOP
    candidate := public.inspection_slugify_workshop(r.name, r.id);
    n := 0;
    WHILE EXISTS (
      SELECT 1
      FROM public.inspection_workshops w
      WHERE w.slug = candidate
        AND w.id <> r.id
    ) LOOP
      n := n + 1;
      candidate := public.inspection_slugify_workshop(r.name, r.id) || '-' || n::text;
    END LOOP;
    UPDATE public.inspection_workshops
    SET slug = candidate
    WHERE id = r.id;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ALTER COLUMN slug SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'inspection_workshops_slug_key'
    ) THEN
      CREATE UNIQUE INDEX inspection_workshops_slug_key
        ON public.inspection_workshops (slug);
    END IF;
  END IF;
END $$;

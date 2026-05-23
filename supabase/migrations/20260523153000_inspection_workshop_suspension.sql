-- Step 50: operational workshop suspension for trust/moderation.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_workshops'
  ) THEN
    RAISE NOTICE 'inspection_workshops missing - skip suspension migration';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN is_suspended boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN suspended_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'suspended_by'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN suspended_by text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'suspension_reason'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN suspension_reason text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inspection_workshops_public_active
  ON public.inspection_workshops (is_verified, is_suspended, name);

COMMENT ON COLUMN public.inspection_workshops.is_suspended IS
  'Operational trust flag: suspended workshops are hidden from public discovery and booking surfaces.';

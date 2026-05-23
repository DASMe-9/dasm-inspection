-- Add explicit DASM owner mapping for workshop partner accounts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_workshops'
  ) THEN
    RAISE NOTICE 'inspection_workshops missing - skip owner_user_id migration';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN owner_user_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inspection_workshops_owner_user_id
  ON public.inspection_workshops (owner_user_id)
  WHERE owner_user_id IS NOT NULL;

COMMENT ON COLUMN public.inspection_workshops.owner_user_id IS
  'DASM Platform users.id reference for the workshop owner; kept as text to match external identity IDs.';

-- Saudi national address code for workshop GPS / maps link (additive, guarded).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_workshops'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN IF NOT EXISTS national_address_code text;

    COMMENT ON COLUMN public.inspection_workshops.national_address_code IS
      'Saudi national address (Wasel) short code; drives map_link for GPS/maps.';
  END IF;
END $$;

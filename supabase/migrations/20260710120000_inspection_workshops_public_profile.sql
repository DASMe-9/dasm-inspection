-- Workshop public profile + KYC fields (additive, guarded).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_workshops'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS logo_url text,
      ADD COLUMN IF NOT EXISTS cover_url text,
      ADD COLUMN IF NOT EXISTS whatsapp text,
      ADD COLUMN IF NOT EXISTS instagram text,
      ADD COLUMN IF NOT EXISTS map_link text,
      ADD COLUMN IF NOT EXISTS working_hours text,
      ADD COLUMN IF NOT EXISTS commercial_registration text,
      ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS featured_program_label text;

    COMMENT ON COLUMN public.inspection_workshops.description IS
      'Public workshop bio shown on /workshops/[slug].';
    COMMENT ON COLUMN public.inspection_workshops.commercial_registration IS
      'Saudi commercial registration (CR) for workshop KYC.';
    COMMENT ON COLUMN public.inspection_workshops.is_featured IS
      'Highlights workshop in directory and profile hero.';
    COMMENT ON COLUMN public.inspection_workshops.featured_program_label IS
      'Optional marketing label e.g. seasonal program or competition.';
  END IF;
END $$;

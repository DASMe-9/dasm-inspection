-- Workshop showcase media for public profiles (Grand Market + inspect).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_workshops'
  ) THEN
    RAISE NOTICE 'inspection_workshops missing — skip showcase media migration';
    RETURN;
  END IF;

  ALTER TABLE public.inspection_workshops
    ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS repair_showcase_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS educational_videos jsonb NOT NULL DEFAULT '[]'::jsonb;

  COMMENT ON COLUMN public.inspection_workshops.gallery_urls IS
    'Public workshop facility photos (URL strings).';
  COMMENT ON COLUMN public.inspection_workshops.repair_showcase_urls IS
    'Repair showcase images (before/after, in progress).';
  COMMENT ON COLUMN public.inspection_workshops.educational_videos IS
    'Education clips: [{id,title,description,video_url,thumbnail_url,sort_order}].';
END
$$;

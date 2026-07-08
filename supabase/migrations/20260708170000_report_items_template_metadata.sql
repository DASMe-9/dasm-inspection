-- Per-item template metadata on inspection_report_items so the mobile app can
-- group items by their weighted scoring section, pick the right input control,
-- filter by package tier, and enforce photo-on-fail — all from stored data
-- (single source of truth = the signed-off checklist template).
-- Additive; safe to re-run. Rollback: DROP the four columns + constraints.
ALTER TABLE inspection_report_items
  ADD COLUMN IF NOT EXISTS weighted_section text,
  ADD COLUMN IF NOT EXISTS input_type text,
  ADD COLUMN IF NOT EXISTS tier text,
  ADD COLUMN IF NOT EXISTS photo_required boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inspection_report_items_weighted_section_chk') THEN
    ALTER TABLE inspection_report_items ADD CONSTRAINT inspection_report_items_weighted_section_chk
      CHECK (weighted_section IS NULL OR weighted_section IN
        ('body_paint','engine','transmission','electrical','suspension_tires','ac_cooling','road_test','interior'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inspection_report_items_input_type_chk') THEN
    ALTER TABLE inspection_report_items ADD CONSTRAINT inspection_report_items_input_type_chk
      CHECK (input_type IS NULL OR input_type IN ('pass_warn_fail','numeric','binary'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inspection_report_items_tier_chk') THEN
    ALTER TABLE inspection_report_items ADD CONSTRAINT inspection_report_items_tier_chk
      CHECK (tier IS NULL OR tier IN ('comprehensive','essential'));
  END IF;
END $$;

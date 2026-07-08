-- Persist the weighted inspection score on inspection_reports.
-- Computed at approval from the report items via the signed-off section model
-- (section-grade-from-items.ts + scoring.ts). Stored so the value is stable,
-- queryable, and carried into the Core sync payload for carDetails display.
-- Additive; safe to re-run. Rollback: DROP the four columns.
ALTER TABLE inspection_reports
  ADD COLUMN IF NOT EXISTS final_score numeric(5,1),
  ADD COLUMN IF NOT EXISTS letter_grade text,
  ADD COLUMN IF NOT EXISTS haraj_track text,
  ADD COLUMN IF NOT EXISTS section_grades jsonb;

-- Guard allowed enum-like values (null allowed until first approval computes them).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspection_reports_letter_grade_chk'
  ) THEN
    ALTER TABLE inspection_reports
      ADD CONSTRAINT inspection_reports_letter_grade_chk
      CHECK (letter_grade IS NULL OR letter_grade IN ('A', 'B', 'C', 'D', 'F'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspection_reports_haraj_track_chk'
  ) THEN
    ALTER TABLE inspection_reports
      ADD CONSTRAINT inspection_reports_haraj_track_chk
      CHECK (haraj_track IS NULL OR haraj_track IN ('haraj_live', 'instant', 'delayed', 'fixed', 'rejected'));
  END IF;
END $$;

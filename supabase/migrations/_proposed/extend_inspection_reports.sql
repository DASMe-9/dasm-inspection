-- =============================================================================
-- PROPOSED — NOT APPLIED BY SUPABASE CLI
-- Copy to: supabase/migrations/{YYYYMMDDHHMMSS}_extend_inspection_reports.sql
-- Target DB: DASM-services (bmfqfmsxtotdksvcqfrh)
-- Author: Claude (analysis) — Cursor applies at step 41+
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. inspection_reports — JSONB layers + derived columns
-- -----------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.inspection_reports
  ADD COLUMN IF NOT EXISTS mvpi_layer JSONB,
  ADD COLUMN IF NOT EXISTS workshop_layer JSONB,
  ADD COLUMN IF NOT EXISTS history_layer JSONB,
  ADD COLUMN IF NOT EXISTS final_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS letter_grade TEXT,
  ADD COLUMN IF NOT EXISTS auction_track TEXT,
  ADD COLUMN IF NOT EXISTS total_repair_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS verification_hash TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inspection_reports_letter_grade_check'
  ) THEN
    ALTER TABLE public.inspection_reports
      ADD CONSTRAINT inspection_reports_letter_grade_check
      CHECK (letter_grade IS NULL OR letter_grade IN ('A', 'B', 'C', 'D', 'F'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inspection_reports_auction_track_check'
  ) THEN
    ALTER TABLE public.inspection_reports
      ADD CONSTRAINT inspection_reports_auction_track_check
      CHECK (
        auction_track IS NULL
        OR auction_track IN ('haraj_live', 'instant', 'delayed', 'fixed', 'rejected')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inspection_reports_published_at
  ON public.inspection_reports (published_at DESC)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspection_reports_final_score
  ON public.inspection_reports (final_score DESC NULLS LAST)
  WHERE final_score IS NOT NULL;

COMMENT ON COLUMN public.inspection_reports.mvpi_layer IS 'MVPI official periodic inspection results (read-only layer)';
COMMENT ON COLUMN public.inspection_reports.workshop_layer IS 'Deep workshop inspection — source of truth for scoring';
COMMENT ON COLUMN public.inspection_reports.history_layer IS 'Historical record (odometer, maintenance, import, Absher later)';

-- Optional: JSON Schema validation (enable when extension available on project)
-- CREATE EXTENSION IF NOT EXISTS pg_jsonschema;

-- -----------------------------------------------------------------------------
-- 2. marketplace_inspection_reports — UUID FK fix (Finding 3)
-- Table may exist only on DASM-services; guards skip if absent.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'marketplace_inspection_reports'
  ) THEN
    ALTER TABLE public.marketplace_inspection_reports
      ADD COLUMN IF NOT EXISTS inspection_request_id UUID,
      ADD COLUMN IF NOT EXISTS inspection_report_id UUID;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'marketplace_inspection_reports_request_fkey'
    ) THEN
      ALTER TABLE public.marketplace_inspection_reports
        ADD CONSTRAINT marketplace_inspection_reports_request_fkey
        FOREIGN KEY (inspection_request_id)
        REFERENCES public.inspection_requests (id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'marketplace_inspection_reports_report_fkey'
    ) THEN
      ALTER TABLE public.marketplace_inspection_reports
        ADD CONSTRAINT marketplace_inspection_reports_report_fkey
        FOREIGN KEY (inspection_report_id)
        REFERENCES public.inspection_reports (id) ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_marketplace_inspection_reports_report
      ON public.marketplace_inspection_reports (inspection_report_id);

    CREATE INDEX IF NOT EXISTS idx_marketplace_inspection_reports_request
      ON public.marketplace_inspection_reports (inspection_request_id);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Public listing view (read-optimized; adjust RLS separately at apply time)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_inspection_report_for_listing AS
SELECT
  r.id AS report_id,
  r.request_id,
  r.workshop_id,
  r.final_score,
  r.letter_grade,
  r.auction_track,
  r.total_repair_cost,
  r.published_at,
  r.verification_hash,
  r.overall_summary,
  r.approved_at,
  req.dasm_car_id,
  req.vehicle_label
FROM public.inspection_reports r
JOIN public.inspection_requests req ON req.id = r.request_id
WHERE r.approved_at IS NOT NULL
  AND r.published_at IS NOT NULL;

COMMENT ON VIEW public.v_inspection_report_for_listing IS
  'Published approved reports for marketplace/auction listing surfaces';

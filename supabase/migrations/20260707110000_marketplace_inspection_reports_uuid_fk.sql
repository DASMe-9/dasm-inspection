-- Resolve the marketplace ↔ inspection type mismatch (repo-map liability #3).
-- marketplace_inspection_reports.external_request_id is BIGINT, but the real
-- key inspection_requests.id is UUID — so the two could never be joined by a
-- real foreign key. The table is empty (0 rows) at apply time, so this is a
-- pure additive fix with no data migration.
--
-- Adds canonical UUID link columns + real FKs to inspection_requests /
-- inspection_reports (same DASM-services DB). The legacy external_request_id
-- BIGINT column is kept but deprecated (drop in a later PR per HANDOFF_v2).
-- Guarded: skips cleanly if the table is absent. Additive; safe to re-run.
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

    CREATE INDEX IF NOT EXISTS idx_marketplace_inspection_reports_request
      ON public.marketplace_inspection_reports (inspection_request_id);
    CREATE INDEX IF NOT EXISTS idx_marketplace_inspection_reports_report
      ON public.marketplace_inspection_reports (inspection_report_id);

    COMMENT ON COLUMN public.marketplace_inspection_reports.external_request_id IS
      'DEPRECATED (wrong type: bigint). Use inspection_request_id (uuid). Drop in a later PR.';
    COMMENT ON COLUMN public.marketplace_inspection_reports.inspection_request_id IS
      'Canonical uuid FK → inspection_requests.id';
    COMMENT ON COLUMN public.marketplace_inspection_reports.inspection_report_id IS
      'Canonical uuid FK → inspection_reports.id';
  END IF;
END $$;

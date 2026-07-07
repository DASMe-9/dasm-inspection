-- Durable Core-sync status on inspection_reports.
-- Approval previously succeeded even when the push to DASM Core failed, leaving
-- only an ephemeral stderr log — no way to query, surface, or retry failures.
-- These columns make every sync outcome persistent and queryable.
-- Additive; safe to re-run. Rollback: DROP the four columns + index.
ALTER TABLE inspection_reports
  ADD COLUMN IF NOT EXISTS core_sync_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS core_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS core_sync_error text,
  ADD COLUMN IF NOT EXISTS core_sync_attempts integer NOT NULL DEFAULT 0;

-- Guard allowed values (pending until first attempt; then synced/failed/skipped).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspection_reports_core_sync_status_chk'
  ) THEN
    ALTER TABLE inspection_reports
      ADD CONSTRAINT inspection_reports_core_sync_status_chk
      CHECK (core_sync_status IN ('pending', 'synced', 'failed', 'skipped'));
  END IF;
END $$;

-- Fast lookup of reports needing attention (failed / never-synced) for retry + admin.
CREATE INDEX IF NOT EXISTS idx_reports_core_sync_status
  ON inspection_reports (core_sync_status)
  WHERE core_sync_status IN ('pending', 'failed');

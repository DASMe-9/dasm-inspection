-- Customer preference at create: preferred workshop + preferred slot
-- Apply on DASM-services (inspection_requests).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_requests'
  ) THEN
    RAISE NOTICE 'inspection_requests missing — skip preferred workshop/slot migration';
    RETURN;
  END IF;
END
$$;

ALTER TABLE inspection_requests
  ADD COLUMN IF NOT EXISTS preferred_workshop_id uuid NULL
    REFERENCES inspection_workshops(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preferred_slot_at timestamptz NULL;

COMMENT ON COLUMN inspection_requests.preferred_workshop_id IS
  'Customer preferred workshop at submit; assignment still uses workshop_id.';

COMMENT ON COLUMN inspection_requests.preferred_slot_at IS
  'Customer preferred visit/slot time at submit; may seed field_scheduled_at on field assign.';

CREATE INDEX IF NOT EXISTS idx_inspection_requests_preferred_workshop
  ON inspection_requests (preferred_workshop_id)
  WHERE preferred_workshop_id IS NOT NULL;

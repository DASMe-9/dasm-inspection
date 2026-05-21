-- Step 22: field workflow statuses + request service fields (partial step 7)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'inspection_request_status' AND e.enumlabel = 'dispatched'
  ) THEN
    ALTER TYPE inspection_request_status ADD VALUE 'dispatched';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'inspection_request_status' AND e.enumlabel = 'on_site'
  ) THEN
    ALTER TYPE inspection_request_status ADD VALUE 'on_site';
  END IF;
END
$$;

ALTER TABLE inspection_requests
  ADD COLUMN IF NOT EXISTS service_mode inspection_service_mode NOT NULL DEFAULT 'workshop',
  ADD COLUMN IF NOT EXISTS field_service_address text,
  ADD COLUMN IF NOT EXISTS quoted_fee_sar numeric(12, 2),
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS on_site_at timestamptz;

ALTER TABLE inspection_requests
  DROP CONSTRAINT IF EXISTS inspection_requests_field_address_chk;

ALTER TABLE inspection_requests
  ADD CONSTRAINT inspection_requests_field_address_chk
  CHECK (
    service_mode <> 'field'
    OR (field_service_address IS NOT NULL AND length(trim(field_service_address)) > 0)
    OR status IN ('draft', 'submitted')
  );

COMMENT ON COLUMN inspection_requests.service_mode IS
  'workshop = at workshop; field = mobile inspection with dispatched → on_site workflow.';
COMMENT ON COLUMN inspection_requests.dispatched_at IS
  'When inspector was dispatched to field address (field mode only).';
COMMENT ON COLUMN inspection_requests.on_site_at IS
  'When inspector confirmed arrival on site (field mode only).';

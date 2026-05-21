-- Step 23: optional repair quote separate from inspection service fee (quoted_fee_sar)

ALTER TABLE inspection_requests
  ADD COLUMN IF NOT EXISTS repair_quote_sar numeric(12, 2),
  ADD COLUMN IF NOT EXISTS repair_quote_notes text,
  ADD COLUMN IF NOT EXISTS repair_quote_offered_at timestamptz;

ALTER TABLE inspection_requests
  DROP CONSTRAINT IF EXISTS inspection_requests_repair_quote_chk;

ALTER TABLE inspection_requests
  ADD CONSTRAINT inspection_requests_repair_quote_chk
  CHECK (
    repair_quote_sar IS NULL
    OR (repair_quote_sar >= 0 AND repair_quote_sar <= 9999999.99)
  );

COMMENT ON COLUMN inspection_requests.repair_quote_sar IS
  'Optional post-inspection repair estimate (SAR), separate from quoted_fee_sar inspection fee.';
COMMENT ON COLUMN inspection_requests.repair_quote_notes IS
  'Workshop notes for the optional repair quote (not part of inspection fee).';
COMMENT ON COLUMN inspection_requests.repair_quote_offered_at IS
  'When the repair quote was last set or updated by staff.';

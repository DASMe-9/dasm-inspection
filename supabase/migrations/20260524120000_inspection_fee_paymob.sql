-- Step 24: optional Paymob payment for inspection service fee (quoted_fee_sar)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_fee_payment_status') THEN
    CREATE TYPE inspection_fee_payment_status AS ENUM ('unpaid', 'pending', 'paid', 'waived');
  END IF;
END
$$;

ALTER TABLE inspection_requests
  ADD COLUMN IF NOT EXISTS inspection_fee_payment_status inspection_fee_payment_status NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS inspection_fee_payment_ref text,
  ADD COLUMN IF NOT EXISTS inspection_fee_paid_at timestamptz;

COMMENT ON COLUMN inspection_requests.inspection_fee_payment_status IS
  'Payment state for quoted_fee_sar (inspection service fee). repair_quote_sar is separate.';
COMMENT ON COLUMN inspection_requests.inspection_fee_payment_ref IS
  'Paymob merchant order ref (INSP-…) when checkout started or paid.';

-- Step 21: service pricing catalog (workshop vs field / on-site)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_service_mode') THEN
    CREATE TYPE inspection_service_mode AS ENUM ('workshop', 'field');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS inspection_service_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES inspection_workshops(id) ON DELETE CASCADE,
  service_mode inspection_service_mode NOT NULL,
  price_sar numeric(12, 2) NOT NULL CHECK (price_sar >= 0),
  currency text NOT NULL DEFAULT 'SAR',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inspection_pricing_platform_mode
  ON inspection_service_pricing (service_mode)
  WHERE workshop_id IS NULL AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inspection_pricing_workshop_mode
  ON inspection_service_pricing (workshop_id, service_mode)
  WHERE workshop_id IS NOT NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_inspection_pricing_workshop
  ON inspection_service_pricing (workshop_id)
  WHERE workshop_id IS NOT NULL;

DROP TRIGGER IF EXISTS tr_service_pricing_updated ON inspection_service_pricing;
CREATE TRIGGER tr_service_pricing_updated
  BEFORE UPDATE ON inspection_service_pricing
  FOR EACH ROW EXECUTE FUNCTION inspection_set_updated_at();

ALTER TABLE inspection_service_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspection_service_pricing_no_direct_authenticated"
  ON inspection_service_pricing;

CREATE POLICY "inspection_service_pricing_no_direct_authenticated"
  ON inspection_service_pricing
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE inspection_service_pricing IS
  'Catalog: workshop_id NULL = platform default; per-workshop overrides for workshop vs field service.';

COMMENT ON COLUMN inspection_service_pricing.service_mode IS
  'workshop = at workshop premises; field = on-site / mobile inspection.';

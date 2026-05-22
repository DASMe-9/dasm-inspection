-- Step 32: مناطق خدمة الورشة (مدن/أحياء للفحص في الورشة أو ميداني)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_workshops'
  ) THEN
    RAISE NOTICE 'inspection_workshops missing — skip service areas migration';
    RETURN;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS inspection_workshop_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES inspection_workshops(id) ON DELETE CASCADE,
  city text NOT NULL,
  district text,
  supports_workshop boolean NOT NULL DEFAULT true,
  supports_field boolean NOT NULL DEFAULT true,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_workshop_service_areas_city_nonempty
    CHECK (char_length(trim(city)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_service_areas_city
  ON inspection_workshop_service_areas (workshop_id, lower(trim(city)));

CREATE INDEX IF NOT EXISTS idx_workshop_service_areas_workshop
  ON inspection_workshop_service_areas (workshop_id);

DROP TRIGGER IF EXISTS tr_workshop_service_areas_updated ON inspection_workshop_service_areas;
CREATE TRIGGER tr_workshop_service_areas_updated
  BEFORE UPDATE ON inspection_workshop_service_areas
  FOR EACH ROW EXECUTE FUNCTION inspection_set_updated_at();

ALTER TABLE inspection_workshop_service_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspection_workshop_service_areas_no_direct_authenticated"
  ON inspection_workshop_service_areas;

CREATE POLICY "inspection_workshop_service_areas_no_direct_authenticated"
  ON inspection_workshop_service_areas
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE inspection_workshop_service_areas IS
  'Cities/districts a workshop serves for workshop-site and/or field inspection.';

-- Step 34: موعد ميداني + إحداثيات اختيارية لخريطة التشغيل

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_requests'
  ) THEN
    RAISE NOTICE 'inspection_requests missing — skip field schedule migration';
    RETURN;
  END IF;
END
$$;

ALTER TABLE inspection_requests
  ADD COLUMN IF NOT EXISTS field_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS field_service_lat numeric(10, 7),
  ADD COLUMN IF NOT EXISTS field_service_lng numeric(10, 7);

COMMENT ON COLUMN inspection_requests.field_scheduled_at IS
  'Planned field visit time (workshop calendar).';
COMMENT ON COLUMN inspection_requests.field_service_lat IS
  'Optional WGS84 latitude for field service map pin.';
COMMENT ON COLUMN inspection_requests.field_service_lng IS
  'Optional WGS84 longitude for field service map pin.';

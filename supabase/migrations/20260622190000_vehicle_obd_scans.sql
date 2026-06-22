-- User/workshop OBD diagnostic snapshots for permanent DASM vehicle history.
CREATE TABLE IF NOT EXISTS inspection_vehicle_obd_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dasm_user_id text NOT NULL,
  dasm_car_id text,
  vehicle_label text,
  scan_date timestamptz NOT NULL DEFAULT now(),
  odometer_km integer CHECK (odometer_km IS NULL OR odometer_km >= 0),
  reader_name text,
  protocol text,
  vin text,
  dtc_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  readiness_monitors jsonb NOT NULL DEFAULT '{}'::jsonb,
  live_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  battery_voltage numeric(5,2)
    CHECK (battery_voltage IS NULL OR battery_voltage >= 0),
  summary text,
  severity text NOT NULL DEFAULT 'unknown'
    CHECK (severity IN ('clear', 'info', 'warning', 'critical', 'unknown')),
  source text NOT NULL DEFAULT 'user_entry'
    CHECK (source IN ('user_entry', 'mobile_reader', 'workshop_entry', 'external_report')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_obd_scans_user_scan_date
  ON inspection_vehicle_obd_scans (dasm_user_id, scan_date DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_obd_scans_car_scan_date
  ON inspection_vehicle_obd_scans (dasm_car_id, scan_date DESC)
  WHERE dasm_car_id IS NOT NULL;

DROP TRIGGER IF EXISTS tr_vehicle_obd_scans_updated
  ON inspection_vehicle_obd_scans;
CREATE TRIGGER tr_vehicle_obd_scans_updated
  BEFORE UPDATE ON inspection_vehicle_obd_scans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE inspection_vehicle_obd_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_obd_scans_no_direct_authenticated"
  ON inspection_vehicle_obd_scans;

CREATE POLICY "vehicle_obd_scans_no_direct_authenticated"
  ON inspection_vehicle_obd_scans
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE inspection_vehicle_obd_scans IS
  'OBD/computer diagnostic snapshots entered by users, captured by mobile readers, imported, or created by workshops.';

COMMENT ON COLUMN inspection_vehicle_obd_scans.source IS
  'Distinguishes manual user entry from mobile-reader, workshop, or external-report OBD data.';

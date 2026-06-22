-- User-maintained periodic service log for DASM vehicle history.
CREATE TABLE IF NOT EXISTS inspection_vehicle_maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dasm_user_id text NOT NULL,
  dasm_car_id text,
  vehicle_label text,
  service_type text NOT NULL
    CHECK (
      service_type IN (
        'oil_change',
        'oil_filter',
        'air_filter',
        'cabin_filter',
        'fuel_filter',
        'tires',
        'brakes',
        'battery',
        'coolant',
        'transmission',
        'obd_scan',
        'periodic_inspection',
        'other'
      )
    ),
  service_date date NOT NULL,
  odometer_km integer CHECK (odometer_km IS NULL OR odometer_km >= 0),
  next_due_date date,
  next_due_odometer_km integer
    CHECK (next_due_odometer_km IS NULL OR next_due_odometer_km >= 0),
  provider_name text,
  notes text,
  source text NOT NULL DEFAULT 'user_entry'
    CHECK (source IN ('user_entry', 'external_report', 'workshop_entry', 'core_import')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_records_user_due
  ON inspection_vehicle_maintenance_records (dasm_user_id, next_due_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_records_car_service
  ON inspection_vehicle_maintenance_records (dasm_car_id, service_date DESC)
  WHERE dasm_car_id IS NOT NULL;

DROP TRIGGER IF EXISTS tr_vehicle_maintenance_records_updated
  ON inspection_vehicle_maintenance_records;
CREATE TRIGGER tr_vehicle_maintenance_records_updated
  BEFORE UPDATE ON inspection_vehicle_maintenance_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE inspection_vehicle_maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_maintenance_records_no_direct_authenticated"
  ON inspection_vehicle_maintenance_records;

CREATE POLICY "vehicle_maintenance_records_no_direct_authenticated"
  ON inspection_vehicle_maintenance_records
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE inspection_vehicle_maintenance_records IS
  'Periodic service and maintenance log entered by DASM users, workshops, or extracted from external reports.';

COMMENT ON COLUMN inspection_vehicle_maintenance_records.source IS
  'Origin of the maintenance record; extracted rows remain distinguishable from user-entered rows.';

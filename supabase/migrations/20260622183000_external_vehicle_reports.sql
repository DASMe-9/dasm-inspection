-- User-owned external inspection reports imported from other workshops/providers.
-- These records support the DASM user app vehicle history vault before OCR is automated.
CREATE TABLE IF NOT EXISTS inspection_external_vehicle_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dasm_user_id text NOT NULL,
  dasm_car_id text,
  vehicle_label text,
  report_source text,
  report_date date,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  ocr_status text NOT NULL DEFAULT 'pending'
    CHECK (ocr_status IN ('pending', 'processing', 'processed', 'failed')),
  extracted_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  maintenance_reminders jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_vehicle_reports_user_created
  ON inspection_external_vehicle_reports (dasm_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_vehicle_reports_car
  ON inspection_external_vehicle_reports (dasm_car_id)
  WHERE dasm_car_id IS NOT NULL;

DROP TRIGGER IF EXISTS tr_external_vehicle_reports_updated
  ON inspection_external_vehicle_reports;
CREATE TRIGGER tr_external_vehicle_reports_updated
  BEFORE UPDATE ON inspection_external_vehicle_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE inspection_external_vehicle_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "external_vehicle_reports_no_direct_authenticated"
  ON inspection_external_vehicle_reports;

CREATE POLICY "external_vehicle_reports_no_direct_authenticated"
  ON inspection_external_vehicle_reports
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE inspection_external_vehicle_reports IS
  'External technical inspection reports uploaded by DASM users for vehicle history and OCR extraction.';

COMMENT ON COLUMN inspection_external_vehicle_reports.ocr_status IS
  'Reader pipeline state: pending until OCR/extraction service processes the uploaded report.';

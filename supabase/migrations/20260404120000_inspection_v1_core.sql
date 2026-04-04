-- DASM Inspection V1 — core schema (prefix: inspection_)

CREATE TYPE inspection_request_status AS ENUM (
  'draft', 'submitted', 'assigned', 'in_progress', 'pending_review', 'approved', 'rejected', 'cancelled'
);

CREATE TYPE inspection_report_item_status AS ENUM ('pass', 'warn', 'fail', 'na');

CREATE TYPE inspection_app_role AS ENUM (
  'super_admin', 'inspection_admin', 'workshop_manager', 'inspector', 'viewer'
);

CREATE TABLE inspection_workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  phone text,
  email text,
  is_verified boolean NOT NULL DEFAULT false,
  dasm_partner_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inspection_inspectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES inspection_workshops(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  dasm_user_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inspection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  dasm_car_id text NOT NULL,
  vehicle_label text NOT NULL,
  dasm_user_id text,
  auction_reference text,
  status inspection_request_status NOT NULL DEFAULT 'draft',
  workshop_id uuid REFERENCES inspection_workshops(id) ON DELETE SET NULL,
  inspector_id uuid REFERENCES inspection_inspectors(id) ON DELETE SET NULL,
  report_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inspection_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES inspection_requests(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL REFERENCES inspection_workshops(id),
  inspector_id uuid NOT NULL REFERENCES inspection_inspectors(id),
  overall_summary text NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by_role inspection_app_role,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id)
);

ALTER TABLE inspection_requests
  ADD CONSTRAINT inspection_requests_report_fk
  FOREIGN KEY (report_id) REFERENCES inspection_reports(id) ON DELETE SET NULL;

CREATE TABLE inspection_report_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
  section text NOT NULL,
  label text NOT NULL,
  status inspection_report_item_status NOT NULL DEFAULT 'na',
  notes text,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE inspection_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES inspection_requests(id) ON DELETE CASCADE,
  report_id uuid REFERENCES inspection_reports(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  storage_path text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inspection_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES inspection_requests(id) ON DELETE CASCADE,
  status inspection_request_status NOT NULL,
  note text,
  actor_role inspection_app_role NOT NULL DEFAULT 'inspection_admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspection_requests_status ON inspection_requests(status);
CREATE INDEX idx_inspection_requests_workshop ON inspection_requests(workshop_id);
CREATE INDEX idx_inspection_reports_request ON inspection_reports(request_id);
CREATE INDEX idx_inspection_history_request ON inspection_status_history(request_id);
CREATE OR REPLACE FUNCTION inspection_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_workshops_updated BEFORE UPDATE ON inspection_workshops
  FOR EACH ROW EXECUTE FUNCTION inspection_set_updated_at();
CREATE TRIGGER tr_inspectors_updated BEFORE UPDATE ON inspection_inspectors
  FOR EACH ROW EXECUTE FUNCTION inspection_set_updated_at();
CREATE TRIGGER tr_requests_updated BEFORE UPDATE ON inspection_requests
  FOR EACH ROW EXECUTE FUNCTION inspection_set_updated_at();
CREATE TRIGGER tr_reports_updated BEFORE UPDATE ON inspection_reports
  FOR EACH ROW EXECUTE FUNCTION inspection_set_updated_at();
ALTER TABLE inspection_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_report_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspection_workshops_rw" ON inspection_workshops FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inspection_inspectors_rw" ON inspection_inspectors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inspection_requests_rw" ON inspection_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inspection_reports_rw" ON inspection_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inspection_report_items_rw" ON inspection_report_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inspection_attachments_rw" ON inspection_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inspection_status_history_rw" ON inspection_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
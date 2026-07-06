-- Structured repair recommendations per inspection request (P3).
-- Additive; RLS deny-all to authenticated (backend uses service_role). Rollback: DROP TABLE.
CREATE TABLE IF NOT EXISTS inspection_repair_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES inspection_requests(id) ON DELETE CASCADE,
  report_id uuid REFERENCES inspection_reports(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'advisory'
    CHECK (severity IN ('advisory','minor','major','critical')),
  estimated_cost_sar numeric(10,2) CHECK (estimated_cost_sar IS NULL OR estimated_cost_sar >= 0),
  status text NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested','accepted','declined','completed')),
  created_by_role text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repair_recommendations_request
  ON inspection_repair_recommendations (request_id, sort_order);

DROP TRIGGER IF EXISTS tr_repair_recommendations_updated ON inspection_repair_recommendations;
CREATE TRIGGER tr_repair_recommendations_updated
  BEFORE UPDATE ON inspection_repair_recommendations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE inspection_repair_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "repair_recommendations_no_direct_authenticated" ON inspection_repair_recommendations;
CREATE POLICY "repair_recommendations_no_direct_authenticated"
  ON inspection_repair_recommendations FOR ALL TO authenticated USING (false) WITH CHECK (false);

COMMENT ON TABLE inspection_repair_recommendations IS
  'Structured repair recommendations tied to an inspection request (workshop-authored, customer-visible).';

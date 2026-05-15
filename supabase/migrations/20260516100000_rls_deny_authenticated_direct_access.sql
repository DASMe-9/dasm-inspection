-- Close permissive RLS for role `authenticated` on inspection tables.
-- The Next.js app uses the Supabase service role on the server only; open
-- policies allowed any logged-in Supabase client full access via PostgREST.
-- Service role continues to bypass RLS.

DROP POLICY IF EXISTS "inspection_workshops_rw" ON inspection_workshops;
DROP POLICY IF EXISTS "inspection_inspectors_rw" ON inspection_inspectors;
DROP POLICY IF EXISTS "inspection_requests_rw" ON inspection_requests;
DROP POLICY IF EXISTS "inspection_reports_rw" ON inspection_reports;
DROP POLICY IF EXISTS "inspection_report_items_rw" ON inspection_report_items;
DROP POLICY IF EXISTS "inspection_attachments_rw" ON inspection_attachments;
DROP POLICY IF EXISTS "inspection_status_history_rw" ON inspection_status_history;

CREATE POLICY "inspection_workshops_no_direct_authenticated"
  ON inspection_workshops FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "inspection_inspectors_no_direct_authenticated"
  ON inspection_inspectors FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "inspection_requests_no_direct_authenticated"
  ON inspection_requests FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "inspection_reports_no_direct_authenticated"
  ON inspection_reports FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "inspection_report_items_no_direct_authenticated"
  ON inspection_report_items FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "inspection_attachments_no_direct_authenticated"
  ON inspection_attachments FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "inspection_status_history_no_direct_authenticated"
  ON inspection_status_history FOR ALL TO authenticated USING (false) WITH CHECK (false);

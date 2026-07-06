-- Per-request message thread between customer and workshop (P3).
-- Additive; RLS deny-all to authenticated (backend service_role). Rollback: DROP TABLE.
CREATE TABLE IF NOT EXISTS inspection_request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES inspection_requests(id) ON DELETE CASCADE,
  sender_dasm_user_id text,
  sender_role text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_request_messages_request_created
  ON inspection_request_messages (request_id, created_at);
ALTER TABLE inspection_request_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "request_messages_no_direct_authenticated" ON inspection_request_messages;
CREATE POLICY "request_messages_no_direct_authenticated"
  ON inspection_request_messages FOR ALL TO authenticated USING (false) WITH CHECK (false);
COMMENT ON TABLE inspection_request_messages IS
  'Message thread on an inspection request (customer <-> workshop/inspector/admin).';

-- Step 28: workshop followers + in-app notifications

CREATE TABLE IF NOT EXISTS inspection_workshop_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES inspection_workshops(id) ON DELETE CASCADE,
  dasm_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_workshop_follows_unique UNIQUE (workshop_id, dasm_user_id)
);

CREATE INDEX IF NOT EXISTS idx_inspection_workshop_follows_user
  ON inspection_workshop_follows (dasm_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inspection_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dasm_user_id text NOT NULL,
  workshop_id uuid REFERENCES inspection_workshops(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'workshop_update',
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_notifications_user_unread
  ON inspection_notifications (dasm_user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE inspection_workshop_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inspection_workshop_follows_no_direct_authenticated
  ON inspection_workshop_follows;
CREATE POLICY inspection_workshop_follows_no_direct_authenticated
  ON inspection_workshop_follows FOR ALL TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS inspection_notifications_no_direct_authenticated
  ON inspection_notifications;
CREATE POLICY inspection_notifications_no_direct_authenticated
  ON inspection_notifications FOR ALL TO authenticated USING (false) WITH CHECK (false);

COMMENT ON TABLE inspection_workshop_follows IS 'Users following a workshop for updates.';
COMMENT ON TABLE inspection_notifications IS 'In-app notifications for inspection users (service role writes).';

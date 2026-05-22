-- Step 25: public workshop partner application intake

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_workshop_application_status') THEN
    CREATE TYPE inspection_workshop_application_status AS ENUM (
      'submitted',
      'under_review',
      'approved',
      'rejected'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS inspection_workshop_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_name text NOT NULL,
  city text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text,
  dasm_user_id text,
  commercial_registration text,
  notes text,
  status inspection_workshop_application_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_workshop_applications_status
  ON inspection_workshop_applications (status, created_at DESC);

CREATE TRIGGER tr_workshop_applications_updated
  BEFORE UPDATE ON inspection_workshop_applications
  FOR EACH ROW EXECUTE FUNCTION inspection_set_updated_at();

ALTER TABLE inspection_workshop_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inspection_workshop_applications_no_direct_authenticated
  ON inspection_workshop_applications;

CREATE POLICY inspection_workshop_applications_no_direct_authenticated
  ON inspection_workshop_applications
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE inspection_workshop_applications IS
  'Inbound applications to join the DASM inspection workshop network (admin review via service role).';

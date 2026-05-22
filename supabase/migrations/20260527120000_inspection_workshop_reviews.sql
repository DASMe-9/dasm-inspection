-- Step 27: workshop reviews (after approved request only) + moderation

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_workshop_review_status') THEN
    CREATE TYPE inspection_workshop_review_status AS ENUM (
      'pending',
      'approved',
      'rejected'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS inspection_workshop_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES inspection_workshops(id) ON DELETE CASCADE,
  dasm_user_id text NOT NULL,
  inspection_request_id uuid NOT NULL REFERENCES inspection_requests(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status inspection_workshop_review_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  moderated_at timestamptz,
  moderated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspection_workshop_reviews_request_unique UNIQUE (inspection_request_id)
);

CREATE INDEX IF NOT EXISTS idx_inspection_workshop_reviews_workshop_status
  ON inspection_workshop_reviews (workshop_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inspection_workshop_reviews_pending
  ON inspection_workshop_reviews (status, created_at DESC)
  WHERE status = 'pending';

CREATE TRIGGER tr_workshop_reviews_updated
  BEFORE UPDATE ON inspection_workshop_reviews
  FOR EACH ROW EXECUTE FUNCTION inspection_set_updated_at();

ALTER TABLE inspection_workshop_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inspection_workshop_reviews_no_direct_authenticated
  ON inspection_workshop_reviews;

CREATE POLICY inspection_workshop_reviews_no_direct_authenticated
  ON inspection_workshop_reviews
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE inspection_workshop_reviews IS
  'Customer reviews for workshops; one per approved inspection_request; public after moderation approved.';

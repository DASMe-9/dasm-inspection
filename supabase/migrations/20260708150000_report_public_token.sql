-- Public share token for approved inspection reports.
-- Issued (in application code) strictly on approval; nulled on reject/un-approve.
-- The public report page is reachable only via this unguessable token and only
-- when the report is approved. Nullable so unapproved/revoked reports have none.
-- Additive; safe to re-run. Rollback: DROP the index + column.
ALTER TABLE inspection_reports
  ADD COLUMN IF NOT EXISTS public_token uuid;

-- Partial unique index: enforces uniqueness of issued tokens while allowing
-- many NULLs (unapproved / revoked reports).
CREATE UNIQUE INDEX IF NOT EXISTS uq_inspection_reports_public_token
  ON inspection_reports (public_token)
  WHERE public_token IS NOT NULL;

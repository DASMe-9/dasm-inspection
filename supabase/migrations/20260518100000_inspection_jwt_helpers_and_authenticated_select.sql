-- Phase after rls_deny_authenticated_direct_access: permissive SELECT for role
-- authenticated when auth.jwt() carries DASM / Supabase-aligned claims.
-- Multiple permissive policies OR; the deny-all USING(false) stays in place for writes.
--
-- Claim keys aligned with frontend/src/lib/auth/normalize-claims.ts and
-- supabase/staging/phase2b_rls_template.sql

CREATE OR REPLACE FUNCTION public.inspection_jwt_text_claim(p_key text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> p_key),
    (auth.jwt() -> 'app_metadata' ->> p_key),
    (auth.jwt() -> 'user_metadata' ->> p_key)
  );
$$;

REVOKE ALL ON FUNCTION public.inspection_jwt_text_claim(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inspection_jwt_text_claim(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inspection_jwt_text_claim(text) TO service_role;

-- --- inspection_requests ----------------------------------------------------

DROP POLICY IF EXISTS inspection_requests_select_jwt_authenticated ON public.inspection_requests;

CREATE POLICY inspection_requests_select_jwt_authenticated
  ON public.inspection_requests
  FOR SELECT
  TO authenticated
  USING (
    inspection_jwt_text_claim('inspection_role') IN ('inspection_admin', 'super_admin')
    OR (
      inspection_jwt_text_claim('inspection_role') IN ('workshop_owner', 'workshop_manager', 'viewer')
      AND workshop_id IS NOT NULL
      AND (
        workshop_id::text = inspection_jwt_text_claim('workshop_id')
        OR workshop_id::text = inspection_jwt_text_claim('organization_id')
      )
    )
    OR (
      inspection_jwt_text_claim('inspection_role') IN ('inspector', 'mechanic')
      AND inspector_id IS NOT NULL
      AND inspector_id::text = inspection_jwt_text_claim('inspector_record_id')
    )
    OR (
      inspection_jwt_text_claim('inspection_role') = 'dasm_user'
      AND dasm_user_id IS NOT NULL
      AND (
        dasm_user_id = inspection_jwt_text_claim('dasm_user_id')
        OR dasm_user_id = inspection_jwt_text_claim('user_id')
      )
    )
  );

-- --- inspection_reports (via parent request visibility) ----------------------

DROP POLICY IF EXISTS inspection_reports_select_jwt_authenticated ON public.inspection_reports;

CREATE POLICY inspection_reports_select_jwt_authenticated
  ON public.inspection_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspection_requests r
      WHERE r.id = inspection_reports.request_id
      AND (
        inspection_jwt_text_claim('inspection_role') IN ('inspection_admin', 'super_admin')
        OR (
          inspection_jwt_text_claim('inspection_role') IN ('workshop_owner', 'workshop_manager', 'viewer')
          AND r.workshop_id IS NOT NULL
          AND (
            r.workshop_id::text = inspection_jwt_text_claim('workshop_id')
            OR r.workshop_id::text = inspection_jwt_text_claim('organization_id')
          )
        )
        OR (
          inspection_jwt_text_claim('inspection_role') IN ('inspector', 'mechanic')
          AND r.inspector_id IS NOT NULL
          AND r.inspector_id::text = inspection_jwt_text_claim('inspector_record_id')
        )
        OR (
          inspection_jwt_text_claim('inspection_role') = 'dasm_user'
          AND r.dasm_user_id IS NOT NULL
          AND (
            r.dasm_user_id = inspection_jwt_text_claim('dasm_user_id')
            OR r.dasm_user_id = inspection_jwt_text_claim('user_id')
          )
        )
      )
    )
  );

-- --- inspection_report_items -------------------------------------------------

DROP POLICY IF EXISTS inspection_report_items_select_jwt_authenticated ON public.inspection_report_items;

CREATE POLICY inspection_report_items_select_jwt_authenticated
  ON public.inspection_report_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspection_reports rep
      INNER JOIN public.inspection_requests rq ON rq.id = rep.request_id
      WHERE rep.id = inspection_report_items.report_id
      AND (
        inspection_jwt_text_claim('inspection_role') IN ('inspection_admin', 'super_admin')
        OR (
          inspection_jwt_text_claim('inspection_role') IN ('workshop_owner', 'workshop_manager', 'viewer')
          AND rq.workshop_id IS NOT NULL
          AND (
            rq.workshop_id::text = inspection_jwt_text_claim('workshop_id')
            OR rq.workshop_id::text = inspection_jwt_text_claim('organization_id')
          )
        )
        OR (
          inspection_jwt_text_claim('inspection_role') IN ('inspector', 'mechanic')
          AND rq.inspector_id IS NOT NULL
          AND rq.inspector_id::text = inspection_jwt_text_claim('inspector_record_id')
        )
        OR (
          inspection_jwt_text_claim('inspection_role') = 'dasm_user'
          AND rq.dasm_user_id IS NOT NULL
          AND (
            rq.dasm_user_id = inspection_jwt_text_claim('dasm_user_id')
            OR rq.dasm_user_id = inspection_jwt_text_claim('user_id')
          )
        )
      )
    )
  );

-- --- inspection_attachments --------------------------------------------------

DROP POLICY IF EXISTS inspection_attachments_select_jwt_authenticated ON public.inspection_attachments;

CREATE POLICY inspection_attachments_select_jwt_authenticated
  ON public.inspection_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspection_requests rq
      WHERE rq.id = inspection_attachments.request_id
      AND (
        inspection_jwt_text_claim('inspection_role') IN ('inspection_admin', 'super_admin')
        OR (
          inspection_jwt_text_claim('inspection_role') IN ('workshop_owner', 'workshop_manager', 'viewer')
          AND rq.workshop_id IS NOT NULL
          AND (
            rq.workshop_id::text = inspection_jwt_text_claim('workshop_id')
            OR rq.workshop_id::text = inspection_jwt_text_claim('organization_id')
          )
        )
        OR (
          inspection_jwt_text_claim('inspection_role') IN ('inspector', 'mechanic')
          AND rq.inspector_id IS NOT NULL
          AND rq.inspector_id::text = inspection_jwt_text_claim('inspector_record_id')
        )
        OR (
          inspection_jwt_text_claim('inspection_role') = 'dasm_user'
          AND rq.dasm_user_id IS NOT NULL
          AND (
            rq.dasm_user_id = inspection_jwt_text_claim('dasm_user_id')
            OR rq.dasm_user_id = inspection_jwt_text_claim('user_id')
          )
        )
      )
    )
  );

-- --- inspection_status_history ----------------------------------------------

DROP POLICY IF EXISTS inspection_status_history_select_jwt_authenticated ON public.inspection_status_history;

CREATE POLICY inspection_status_history_select_jwt_authenticated
  ON public.inspection_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspection_requests rq
      WHERE rq.id = inspection_status_history.request_id
      AND (
        inspection_jwt_text_claim('inspection_role') IN ('inspection_admin', 'super_admin')
        OR (
          inspection_jwt_text_claim('inspection_role') IN ('workshop_owner', 'workshop_manager', 'viewer')
          AND rq.workshop_id IS NOT NULL
          AND (
            rq.workshop_id::text = inspection_jwt_text_claim('workshop_id')
            OR rq.workshop_id::text = inspection_jwt_text_claim('organization_id')
          )
        )
        OR (
          inspection_jwt_text_claim('inspection_role') IN ('inspector', 'mechanic')
          AND rq.inspector_id IS NOT NULL
          AND rq.inspector_id::text = inspection_jwt_text_claim('inspector_record_id')
        )
        OR (
          inspection_jwt_text_claim('inspection_role') = 'dasm_user'
          AND rq.dasm_user_id IS NOT NULL
          AND (
            rq.dasm_user_id = inspection_jwt_text_claim('dasm_user_id')
            OR rq.dasm_user_id = inspection_jwt_text_claim('user_id')
          )
        )
      )
    )
  );

-- --- inspection_workshops ----------------------------------------------------

DROP POLICY IF EXISTS inspection_workshops_select_jwt_authenticated ON public.inspection_workshops;

CREATE POLICY inspection_workshops_select_jwt_authenticated
  ON public.inspection_workshops
  FOR SELECT
  TO authenticated
  USING (
    inspection_jwt_text_claim('inspection_role') IN ('inspection_admin', 'super_admin')
    OR (
      inspection_jwt_text_claim('inspection_role') IN ('workshop_owner', 'workshop_manager', 'viewer')
      AND (
        id::text = inspection_jwt_text_claim('workshop_id')
        OR id::text = inspection_jwt_text_claim('organization_id')
      )
    )
    OR (
      inspection_jwt_text_claim('inspection_role') IN ('inspector', 'mechanic')
      AND EXISTS (
        SELECT 1 FROM public.inspection_inspectors ins
        WHERE ins.workshop_id = inspection_workshops.id
          AND ins.id::text = inspection_jwt_text_claim('inspector_record_id')
      )
    )
  );

-- --- inspection_inspectors ---------------------------------------------------

DROP POLICY IF EXISTS inspection_inspectors_select_jwt_authenticated ON public.inspection_inspectors;

CREATE POLICY inspection_inspectors_select_jwt_authenticated
  ON public.inspection_inspectors
  FOR SELECT
  TO authenticated
  USING (
    inspection_jwt_text_claim('inspection_role') IN ('inspection_admin', 'super_admin')
    OR (
      inspection_jwt_text_claim('inspection_role') IN ('workshop_owner', 'workshop_manager', 'viewer')
      AND workshop_id IS NOT NULL
      AND (
        workshop_id::text = inspection_jwt_text_claim('workshop_id')
        OR workshop_id::text = inspection_jwt_text_claim('organization_id')
      )
    )
    OR (
      inspection_jwt_text_claim('inspection_role') IN ('inspector', 'mechanic')
      AND id::text = inspection_jwt_text_claim('inspector_record_id')
    )
  );

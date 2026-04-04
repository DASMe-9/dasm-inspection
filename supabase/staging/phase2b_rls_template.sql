-- =============================================================================
-- STAGING ONLY — DASM Inspection Phase 2b RLS template
-- DO NOT run on production. Not loaded by `supabase db push` (lives outside /migrations).
-- Adjust claim keys to match your Supabase JWT / DASM bridge template.
-- =============================================================================

-- Helper: read claim from top-level JWT or app_metadata (Supabase-style)
CREATE OR REPLACE FUNCTION public.inspection_jwt_text_claim(p_key text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> p_key),
    (auth.jwt() -> 'app_metadata' ->> p_key)
  );
$$;

REVOKE ALL ON FUNCTION public.inspection_jwt_text_claim(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inspection_jwt_text_claim(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inspection_jwt_text_claim(text) TO service_role;

-- Example: stricter SELECT on requests (replace permissive policy on staging only)
DROP POLICY IF EXISTS "inspection_requests_rw" ON public.inspection_requests;

CREATE POLICY "inspection_requests_select_staging"
  ON public.inspection_requests
  FOR SELECT
  TO authenticated
  USING (
    inspection_jwt_text_claim('inspection_role') IN ('inspection_admin', 'super_admin')
    OR (
      inspection_jwt_text_claim('inspection_role') = 'workshop_owner'
      AND workshop_id IS NOT NULL
      AND workshop_id::text = inspection_jwt_text_claim('workshop_id')
    )
    OR (
      inspection_jwt_text_claim('inspection_role') IN ('inspector', 'mechanic')
      AND inspector_id IS NOT NULL
      AND inspector_id::text = inspection_jwt_text_claim('inspector_record_id')
    )
    OR (
      inspection_jwt_text_claim('inspection_role') = 'dasm_user'
      AND dasm_user_id IS NOT NULL
      AND dasm_user_id = inspection_jwt_text_claim('dasm_user_id')
    )
  );

-- لا سياسات INSERT/UPDATE هنا عمداً: على staging اختبر القراءة بـ JWT؛ الكتابة تبقى عبر service role
-- من Next حتى تُضاف سياسات كتابة مفصّلة وفق docs/rls-policies.md.

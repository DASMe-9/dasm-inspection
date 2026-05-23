-- Public approved-report summary for Core sync and read-only consumers.
CREATE OR REPLACE VIEW public.inspection_report_public_summary AS
SELECT
  r.id AS inspection_report_id,
  r.request_id AS inspection_request_id,
  r.workshop_id,
  r.inspector_id,
  r.approved_at,
  jsonb_build_object(
    'pass', COUNT(i.id) FILTER (WHERE i.status = 'pass'),
    'warn', COUNT(i.id) FILTER (WHERE i.status = 'warn'),
    'fail', COUNT(i.id) FILTER (WHERE i.status = 'fail'),
    'na', COUNT(i.id) FILTER (WHERE i.status = 'na')
  ) AS summary,
  concat('/reports/', r.id::text) AS report_path
FROM public.inspection_reports r
LEFT JOIN public.inspection_report_items i
  ON i.report_id = r.id
WHERE r.approved_at IS NOT NULL
GROUP BY
  r.id,
  r.request_id,
  r.workshop_id,
  r.inspector_id,
  r.approved_at;

COMMENT ON VIEW public.inspection_report_public_summary IS
  'Approved inspection report summary counts and public report path for Core sync/read-only surfaces.';

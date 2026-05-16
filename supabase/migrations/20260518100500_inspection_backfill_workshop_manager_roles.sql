-- Align historical enum rows: workshop_manager → workshop_owner (product naming).
-- Intentionally rewrites archived history/reports for unified analytics; snapshots
-- outside Postgres are unaffected. Safe only after enum value workshop_owner exists (phase2 migration).

UPDATE public.inspection_status_history
SET actor_role = 'workshop_owner'::inspection_app_role
WHERE actor_role::text = 'workshop_manager';

UPDATE public.inspection_reports
SET approved_by_role = 'workshop_owner'::inspection_app_role
WHERE approved_by_role::text = 'workshop_manager';

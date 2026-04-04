-- Phase 2 — إضافة قيم لـ inspection_app_role فقط (additive، لا حذف ولا إعادة تسمية).
-- يحافظ على صفوف inspection_status_history و inspection_reports التاريخية كما هي.

DO $body$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    INNER JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'inspection_app_role'
      AND e.enumlabel = 'workshop_owner'
  ) THEN
    ALTER TYPE inspection_app_role ADD VALUE 'workshop_owner';
  END IF;
END
$body$;

DO $body$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    INNER JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'inspection_app_role'
      AND e.enumlabel = 'mechanic'
  ) THEN
    ALTER TYPE inspection_app_role ADD VALUE 'mechanic';
  END IF;
END
$body$;

DO $body$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    INNER JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'inspection_app_role'
      AND e.enumlabel = 'dasm_user'
  ) THEN
    ALTER TYPE inspection_app_role ADD VALUE 'dasm_user';
  END IF;
END
$body$;

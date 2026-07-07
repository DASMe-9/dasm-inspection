-- Phase 1 (money-engine foundation) — repo mirror of the applied migration.
-- Workshop owner mapping (payee) + IBAN payout fields for the 80% net
-- workshop settlement (release-on-approval). Additive, nullable, safe to re-run.
-- Applied to DASM-services (bmfqfmsxtotdksvcqfrh) via Supabase MCP 2026-07-07.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='inspection_workshops'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN IF NOT EXISTS owner_user_id text,
      ADD COLUMN IF NOT EXISTS bank_iban text,
      ADD COLUMN IF NOT EXISTS bank_beneficiary_name text;

    CREATE INDEX IF NOT EXISTS idx_inspection_workshops_owner_user_id
      ON public.inspection_workshops (owner_user_id)
      WHERE owner_user_id IS NOT NULL;

    COMMENT ON COLUMN public.inspection_workshops.owner_user_id IS
      'DASM Platform users.id (text) — payee for workshop payout (80% net).';
    COMMENT ON COLUMN public.inspection_workshops.bank_iban IS
      'Workshop IBAN for payout of the net 80% after release-on-approval.';
    COMMENT ON COLUMN public.inspection_workshops.bank_beneficiary_name IS
      'Beneficiary name on the workshop bank account (for IBAN payout).';
  END IF;
END $$;

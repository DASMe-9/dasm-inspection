-- تفضيلات إخفاء عناصر الشريط للورشة + دعوات انضمام مسبقة الإعداد
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_workshops'
  ) THEN
    RAISE NOTICE 'inspection_workshops missing — skip nav/invites migration';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspection_workshops'
      AND column_name = 'sidebar_hidden_nav_keys'
  ) THEN
    ALTER TABLE public.inspection_workshops
      ADD COLUMN sidebar_hidden_nav_keys jsonb NOT NULL DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN public.inspection_workshops.sidebar_hidden_nav_keys IS
      'مفاتيح عناصر الشريط الجانبي المخفية لمالك/مدير الورشة (requests, wallet, subscription, settings).';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_workshop_invites'
  ) THEN
    RETURN;
  END IF;

  CREATE TABLE public.inspection_workshop_invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL UNIQUE,
    workshop_name text NOT NULL,
    city text NOT NULL,
    contact_name text,
    phone text,
    email text,
    dasm_user_id text,
    notes text,
    status text NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled')),
    expires_at timestamptz NOT NULL,
    redeemed_at timestamptz,
    application_id uuid,
    created_by text,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE INDEX idx_inspection_workshop_invites_token
    ON public.inspection_workshop_invites (token)
    WHERE status = 'pending';

  COMMENT ON TABLE public.inspection_workshop_invites IS
    'دعوات انضمام ورشة — رابط مسبق الإعداد يربط المالك عند التقديم.';
END $$;

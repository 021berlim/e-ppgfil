-- ============================================================
-- e-PPGFIL - Log/outbox de entregas Resend
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type varchar(80) NOT NULL CHECK (event_type IN (
    'welcome',
    'protocol_receipt',
    'protocol_status_update',
    'password_reset'
  )),
  recipient_email citext NOT NULL,
  protocol_id uuid REFERENCES public.protocols(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  resend_email_id text,
  status varchar(40) NOT NULL DEFAULT 'pending',
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_event_created_at
  ON public.email_deliveries(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_protocol_id
  ON public.email_deliveries(protocol_id);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_user_id
  ON public.email_deliveries(user_id);

ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_deliveries FROM anon, authenticated;

COMMIT;

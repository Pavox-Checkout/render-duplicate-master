-- PAYMENT INTEGRATIONS
-- Each account connects its OWN payment gateway credentials. PAVOX only
-- orchestrates payments; the accounts belong to the user. Data is isolated
-- per user through RLS, following the same pattern as products/checkouts:
-- the authenticated user reads and writes only its own rows via the browser
-- Supabase client (no service role required).

CREATE TABLE IF NOT EXISTS public.payment_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  provider TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  status TEXT NOT NULL DEFAULT 'connected',
  enabled_payment_methods TEXT[] NOT NULL DEFAULT '{}',
  -- Raw gateway secrets, RLS-protected (owner only). The client never SELECTs
  -- this column for listing; it is only read by the owner when merging edits.
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Non-reversible display hints (e.g. "•••• 1234") shown in the UI.
  credentials_masked JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Reserved for the future per-method routing/Payment Engine phase.
  routing JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One connection per provider per user (enables upsert on conflict).
  UNIQUE (user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_integrations TO authenticated;
GRANT ALL ON public.payment_integrations TO service_role;

ALTER TABLE public.payment_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own payment integrations" ON public.payment_integrations;
CREATE POLICY "own payment integrations" ON public.payment_integrations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS payment_integrations_user_id_idx
  ON public.payment_integrations(user_id);

-- Reuse the shared touch_updated_at() function created in 0004.
DROP TRIGGER IF EXISTS payment_integrations_touch_updated_at ON public.payment_integrations;
CREATE TRIGGER payment_integrations_touch_updated_at
  BEFORE UPDATE ON public.payment_integrations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

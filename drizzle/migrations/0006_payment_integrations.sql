-- Payment gateway integrations.
-- PAVOX is NOT a gateway. Each account connects and manages its OWN gateway
-- accounts (Mercado Pago, Asaas, Pagar.me, Stripe). One row per account+provider.
CREATE TABLE IF NOT EXISTS public.payment_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  status TEXT NOT NULL DEFAULT 'connected',
  enabled_payment_methods TEXT[] NOT NULL DEFAULT '{}',
  -- Raw gateway secrets. NEVER granted to the client role (see column grants
  -- below); only reachable through server functions using the service role.
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Safe, masked hints (e.g. "•••• 1234") for display in the UI.
  credentials_masked JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Reserved for the future Payment Engine: per-method routing, priority,
  -- fallback and multiple gateways per method.
  routing JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- Column-level privileges: authenticated users may read only NON-secret columns.
-- The raw `credentials` column is intentionally excluded, so a client-side
-- query can never read a stored secret back. All writes go through server
-- functions using the service role, so no write grant is given to authenticated.
GRANT SELECT (
  id, user_id, provider, environment, status, enabled_payment_methods,
  credentials_masked, routing, last_tested_at, last_test_status,
  created_at, updated_at
) ON public.payment_integrations TO authenticated;
GRANT ALL ON public.payment_integrations TO service_role;

ALTER TABLE public.payment_integrations ENABLE ROW LEVEL SECURITY;

-- Multi-tenant isolation: an account can only ever see its own integrations.
DROP POLICY IF EXISTS "own payment integrations" ON public.payment_integrations;
CREATE POLICY "own payment integrations" ON public.payment_integrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS payment_integrations_user_id_idx
  ON public.payment_integrations(user_id);

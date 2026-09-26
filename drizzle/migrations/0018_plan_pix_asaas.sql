-- Pagamentos de assinatura PIX via Asaas Sandbox, reutilizando billing_records.
ALTER TABLE public.billing_records
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS gateway TEXT,
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS billing_records_gateway_payment_unique
  ON public.billing_records (gateway, gateway_payment_id)
  WHERE gateway IS NOT NULL AND gateway_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_records_user_gateway_idx
  ON public.billing_records (user_id, gateway, created_at DESC);
NOTIFY pgrst, 'reload schema';

-- O webhook/service role atualiza billing_records e subscriptions; usuários só leem os próprios registros.
GRANT ALL ON public.billing_records TO service_role;
GRANT SELECT ON public.billing_records TO authenticated;
DROP POLICY IF EXISTS "own billing records" ON public.billing_records;
CREATE POLICY "own billing records" ON public.billing_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.billing_records FROM authenticated;

-- Evita que a mesma cobrança aprovada seja aplicada mais de uma vez.
CREATE UNIQUE INDEX IF NOT EXISTS billing_records_paid_plan_unique
  ON public.billing_records (user_id, plan_id)
  WHERE type = 'mensalidade' AND status = 'pago' AND plan_id IS NOT NULL;

-- Provisionamento do webhook é feito com o endpoint desta função:
-- {SUPABASE_URL}/functions/v1/asaas-plan-webhook
; 

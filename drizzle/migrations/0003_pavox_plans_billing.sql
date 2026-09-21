CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  transaction_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  checkout_limit INTEGER NOT NULL DEFAULT 3,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlight BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plans TO anon;
GRANT ALL ON public.plans TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans are readable" ON public.plans FOR SELECT TO authenticated, anon USING (active);

INSERT INTO public.plans (name, slug, monthly_price, transaction_fee_percent, checkout_limit, features, highlight, position) VALUES
  ('Free', 'free', 0, 1.99, 3, '["Até 3 checkouts","Produtos ilimitados","Recursos básicos","Suporte por e-mail"]'::jsonb, false, 1),
  ('Growth', 'growth', 29.90, 1.49, 3, '["Até 3 checkouts","Recursos avançados","Recuperação de vendas","Relatórios completos"]'::jsonb, true, 2),
  ('Pro', 'pro', 99.00, 0.99, 3, '["Até 3 checkouts","Recursos avançados","Pavox AI","Analytics avançado","Recursos premium","Suporte prioritário"]'::jsonb, false, 3);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  pending_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own subscription" ON public.subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  type TEXT NOT NULL DEFAULT 'taxas',
  description TEXT NOT NULL DEFAULT '',
  reference_period TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_records TO authenticated;
GRANT ALL ON public.billing_records TO service_role;

ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own billing records" ON public.billing_records FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.transaction_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  transaction_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto',
  reference_period TEXT NOT NULL DEFAULT '',
  billing_record_id UUID REFERENCES public.billing_records(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_fees TO authenticated;
GRANT ALL ON public.transaction_fees TO service_role;

ALTER TABLE public.transaction_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own transaction fees" ON public.transaction_fees FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_transaction_fees_user_status ON public.transaction_fees (user_id, status);
CREATE INDEX idx_billing_records_user_created ON public.billing_records (user_id, created_at DESC);

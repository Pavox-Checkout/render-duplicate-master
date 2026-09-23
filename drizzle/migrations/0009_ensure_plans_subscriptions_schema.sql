-- 0009_ensure_plans_subscriptions_schema.sql
--
-- Objetivo: garantir, de forma IDEMPOTENTE, que a estrutura do sistema de planos
-- (public.plans e public.subscriptions) exista e esteja correta em produção, e
-- forçar o recarregamento do schema cache do PostgREST.
--
-- Contexto: o erro observado em produção `PGRST205: Could not find the table
-- 'public.plans' in the schema cache` é um estado transitório do schema cache do
-- PostgREST (ocorre logo após uma migration recarregar o cache). As tabelas já
-- foram criadas pela migration 0003; esta migration NÃO duplica tabelas — apenas
-- assegura a estrutura (no-op quando já existe) e emite o NOTIFY que resolve o cache.
--
-- Segurança de dados: o seed dos planos usa ON CONFLICT (slug) DO NOTHING, de modo
-- que linhas já existentes NÃO são sobrescritas (preserva checkout_limit/features
-- atuais e evita qualquer alteração visual no dashboard). Multi-tenant preservado.

-- 1) Estrutura de public.plans (no-op se já existir) -------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
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

-- slug único (necessário para o upsert por slug). Guardado para idempotência.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plans_slug_key' AND conrelid = 'public.plans'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'plans_slug_key'
  ) THEN
    ALTER TABLE public.plans ADD CONSTRAINT plans_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 2) Estrutura de public.subscriptions (no-op se já existir) ------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  pending_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_id único (uma assinatura por usuário; necessário para upsert onConflict:user_id).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key' AND conrelid = 'public.subscriptions'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_unique' AND conrelid = 'public.subscriptions'::regclass
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE i.indrelid = 'public.subscriptions'::regclass
      AND i.indisunique
      AND (SELECT array_agg(a.attname ORDER BY a.attnum)
           FROM pg_attribute a
           WHERE a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)) = ARRAY['user_id']
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Relação com plans (subscriptions_plan_id_fkey já existe via 0003; guardado).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_plan_id_fkey' AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);
  END IF;
END $$;

-- Relação com auth.users (integridade referencial + limpeza ao excluir usuário).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_fkey' AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Grants (idempotente) ----------------------------------------------------
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plans TO anon;
GRANT ALL ON public.plans TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- 4) RLS + políticas (idempotente via DROP IF EXISTS) ------------------------
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans are readable" ON public.plans;
CREATE POLICY "plans are readable" ON public.plans
  FOR SELECT TO authenticated, anon USING (active);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own subscription" ON public.subscriptions;
CREATE POLICY "own subscription" ON public.subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5) Seed dos 3 planos reais (NÃO sobrescreve linhas existentes) --------------
INSERT INTO public.plans (name, slug, monthly_price, transaction_fee_percent, checkout_limit, features, highlight, position) VALUES
  ('Free',   'free',   0,     1.99, 3,      '["Produtos ilimitados","Checkout básico","Suporte por e-mail"]'::jsonb, false, 1),
  ('Growth', 'growth', 29.90, 1.49, 10,     '["Produtos ilimitados","Checkout avançado","Recuperação de vendas","Relatórios completos"]'::jsonb, true, 2),
  ('Pro',    'pro',    99.00, 0.99, 999999, '["Produtos ilimitados","Pavox AI","Analytics avançado","Recursos premium","Suporte prioritário"]'::jsonb, false, 3)
ON CONFLICT (slug) DO NOTHING;

-- 6) Recarrega o schema cache do PostgREST (fix direto do PGRST205) -----------
NOTIFY pgrst, 'reload schema';

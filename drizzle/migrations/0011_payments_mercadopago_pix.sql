-- 0011_payments_mercadopago_pix.sql
--
-- Sprints 2 e 3: credenciais de gateway criptografadas (Supabase Vault),
-- cobrança Pix via Mercado Pago, webhooks idempotentes e confirmação de pagamento.
--
-- Todas as funções de escrita são executáveis apenas pelo service_role
-- (Edge Functions `integrations`, `public-checkout`, `mercadopago-webhook`).

-- ---------------------------------------------------------------------------
-- Schema privado (não exposto pela API) para helpers usados em policies
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_public_product_image(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.checkouts c
      ON c.user_id = p.user_id AND c.published AND (c.product_id = p.id OR p.checkout_id = c.id)
    WHERE p.main_image = p_name AND p.status = 'Ativo'
  )
$$;
REVOKE ALL ON FUNCTION private.is_public_product_image(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_public_product_image(text) TO anon, authenticated;

DROP POLICY IF EXISTS "product images public for published checkouts" ON storage.objects;
CREATE POLICY "product images public for published checkouts" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images' AND private.is_public_product_image(name));

DROP FUNCTION IF EXISTS public.pavox_is_public_product_image(text);

-- ---------------------------------------------------------------------------
-- Credenciais: segredo no Vault, nunca legível pelo navegador
-- ---------------------------------------------------------------------------
ALTER TABLE public.payment_integrations
  ADD COLUMN IF NOT EXISTS credentials_secret_id UUID,
  ADD COLUMN IF NOT EXISTS account_label TEXT NOT NULL DEFAULT '';

-- Texto puro legado: movido para o Vault abaixo e apagado da tabela.
DO $$
DECLARE r record; v_id uuid;
BEGIN
  FOR r IN SELECT id, user_id, provider, credentials FROM public.payment_integrations
           WHERE credentials IS NOT NULL AND credentials <> '{}'::jsonb AND credentials_secret_id IS NULL LOOP
    v_id := vault.create_secret(r.credentials::text, 'pavox_integration_' || r.id::text,
                                'Credenciais ' || r.provider || ' da loja ' || r.user_id::text);
    UPDATE public.payment_integrations
       SET credentials_secret_id = v_id, credentials = '{}'::jsonb, last_test_status = NULL
     WHERE id = r.id;
  END LOOP;
END $$;

REVOKE ALL ON public.payment_integrations FROM authenticated;
GRANT SELECT (id, user_id, provider, environment, status, enabled_payment_methods, credentials_masked,
              routing, last_tested_at, last_test_status, account_label, created_at, updated_at)
  ON public.payment_integrations TO authenticated;
GRANT UPDATE (status, updated_at) ON public.payment_integrations TO authenticated;

-- O lojista só alterna entre conectado/desativado; "conectado" exige teste aprovado.
CREATE OR REPLACE FUNCTION public.payment_integrations_guard_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Só restringe o próprio lojista (API como `authenticated`); o backend grava livremente.
  IF current_user = 'authenticated' THEN
    IF NEW.status NOT IN ('connected', 'disabled') THEN
      RAISE EXCEPTION 'invalid_status';
    END IF;
    IF NEW.status = 'connected' AND coalesce(OLD.last_test_status, '') <> 'connected' THEN
      RAISE EXCEPTION 'integration_not_verified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_integrations_guard_status ON public.payment_integrations;
CREATE TRIGGER payment_integrations_guard_status
  BEFORE UPDATE OF status ON public.payment_integrations
  FOR EACH ROW EXECUTE FUNCTION public.payment_integrations_guard_status();

CREATE OR REPLACE FUNCTION public.pavox_integration_public_json(i public.payment_integrations)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'id', i.id, 'provider', i.provider, 'environment', i.environment, 'status', i.status,
    'enabled_payment_methods', i.enabled_payment_methods, 'credentials_masked', i.credentials_masked,
    'routing', i.routing, 'last_tested_at', i.last_tested_at, 'last_test_status', i.last_test_status,
    'account_label', i.account_label, 'created_at', i.created_at, 'updated_at', i.updated_at)
$$;

-- Grava/atualiza a integração já validada no gateway. Segredo vai para o Vault.
CREATE OR REPLACE FUNCTION public.pavox_save_integration(
  p_user_id uuid,
  p_provider text,
  p_environment text,
  p_methods text[],
  p_credentials jsonb,
  p_masked jsonb,
  p_account_label text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.payment_integrations;
  v_secret uuid;
BEGIN
  SELECT * INTO v_row FROM public.payment_integrations
  WHERE user_id = p_user_id AND provider = p_provider FOR UPDATE;

  IF FOUND AND v_row.credentials_secret_id IS NOT NULL THEN
    PERFORM vault.update_secret(v_row.credentials_secret_id, p_credentials::text);
    v_secret := v_row.credentials_secret_id;
  ELSE
    v_secret := vault.create_secret(p_credentials::text,
      'pavox_integration_' || p_user_id::text || '_' || p_provider || '_' || substr(md5(random()::text), 1, 6),
      'Credenciais ' || p_provider || ' da loja ' || p_user_id::text);
  END IF;

  INSERT INTO public.payment_integrations AS pi (
    user_id, provider, environment, status, enabled_payment_methods, credentials,
    credentials_masked, credentials_secret_id, account_label, last_tested_at, last_test_status, updated_at
  ) VALUES (
    p_user_id, p_provider, p_environment, 'connected', p_methods, '{}'::jsonb,
    p_masked, v_secret, coalesce(p_account_label, ''), now(), 'connected', now()
  )
  ON CONFLICT (user_id, provider) DO UPDATE SET
    environment = EXCLUDED.environment,
    status = 'connected',
    enabled_payment_methods = EXCLUDED.enabled_payment_methods,
    credentials = '{}'::jsonb,
    credentials_masked = EXCLUDED.credentials_masked,
    credentials_secret_id = EXCLUDED.credentials_secret_id,
    account_label = EXCLUDED.account_label,
    last_tested_at = now(),
    last_test_status = 'connected',
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN public.pavox_integration_public_json(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.pavox_get_integration_credentials(p_user_id uuid, p_provider text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'environment', i.environment,
    'status', i.status,
    'credentials', coalesce((SELECT s.decrypted_secret::jsonb FROM vault.decrypted_secrets s
                             WHERE s.id = i.credentials_secret_id), '{}'::jsonb))
  FROM public.payment_integrations i
  WHERE i.user_id = p_user_id AND i.provider = p_provider
$$;

CREATE OR REPLACE FUNCTION public.pavox_record_integration_test(p_user_id uuid, p_provider text, p_result text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_row public.payment_integrations;
BEGIN
  UPDATE public.payment_integrations
     SET last_tested_at = now(),
         last_test_status = p_result,
         status = CASE WHEN p_result = 'connected' THEN status
                       WHEN status = 'disabled' THEN status
                       ELSE 'error' END,
         updated_at = now()
   WHERE user_id = p_user_id AND provider = p_provider
  RETURNING * INTO v_row;
  RETURN CASE WHEN v_row.id IS NULL THEN NULL ELSE public.pavox_integration_public_json(v_row) END;
END;
$$;

-- ---------------------------------------------------------------------------
-- Gateways implementados e métodos por gateway
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pavox_supported_payment_providers()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT '{mercadopago}'::text[] $$;

CREATE OR REPLACE FUNCTION public.pavox_provider_methods(p_provider text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_provider
    WHEN 'mercadopago' THEN '{pix}'::text[]
    ELSE '{}'::text[]
  END
$$;

CREATE OR REPLACE FUNCTION public.pavox_checkout_payment_methods(p_checkout public.checkouts)
RETURNS text[]
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(array_agg(DISTINCT m ORDER BY m), '{}'::text[])
  FROM public.payment_integrations i, unnest(i.enabled_payment_methods) AS m
  WHERE i.user_id = p_checkout.user_id
    AND i.status = 'connected'
    AND i.credentials_secret_id IS NOT NULL
    AND i.provider = ANY (public.pavox_supported_payment_providers())
    AND m = ANY (public.pavox_provider_methods(i.provider))
    AND coalesce((p_checkout.config -> 'payment' ->> m)::boolean, false)
$$;

-- Gateway que processa um método para a loja (o primeiro conectado).
CREATE OR REPLACE FUNCTION public.pavox_gateway_for_method(p_user_id uuid, p_method text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT i.provider
  FROM public.payment_integrations i
  WHERE i.user_id = p_user_id
    AND i.status = 'connected'
    AND i.credentials_secret_id IS NOT NULL
    AND i.provider = ANY (public.pavox_supported_payment_providers())
    AND p_method = ANY (i.enabled_payment_methods)
    AND p_method = ANY (public.pavox_provider_methods(i.provider))
  ORDER BY i.created_at
  LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- Pedido ↔ cobrança
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.pavox_order_public_json(o public.orders)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'reference', o.reference,
    'status', o.status,
    'amount', o.amount,
    'currency', o.currency,
    'payment_method', o.payment_method,
    'expires_at', o.expires_at,
    'paid_at', o.paid_at,
    'gateway_payment_id', o.gateway_payment_id,
    'payment', o.payment_data
  )
$$;

-- Dados que o backend precisa para cobrar (somente service_role).
CREATE OR REPLACE FUNCTION public.pavox_order_for_payment(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'id', o.id, 'user_id', o.user_id, 'reference', o.reference, 'status', o.status,
    'amount', o.amount, 'currency', o.currency, 'payment_method', o.payment_method,
    'gateway', o.gateway, 'gateway_payment_id', o.gateway_payment_id,
    'expires_at', o.expires_at, 'buyer', o.buyer, 'product', o.product_snapshot,
    'store_name', coalesce(nullif(p.company_name, ''), p.store_slug),
    'provider', public.pavox_gateway_for_method(o.user_id, o.payment_method))
  FROM public.orders o
  JOIN public.profiles p ON p.id = o.user_id
  WHERE o.id = p_order_id
$$;

-- Associa a cobrança criada no gateway ao pedido (uma única vez).
CREATE OR REPLACE FUNCTION public.pavox_attach_payment(
  p_order_id uuid,
  p_gateway text,
  p_payment_id text,
  p_payment_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_order public.orders;
BEGIN
  UPDATE public.orders
     SET gateway = p_gateway,
         gateway_payment_id = p_payment_id,
         payment_data = coalesce(p_payment_data, '{}'::jsonb),
         expires_at = coalesce((p_payment_data ->> 'expires_at')::timestamptz, expires_at)
   WHERE id = p_order_id AND gateway_payment_id IS NULL
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  END IF;
  RETURN public.pavox_order_public_json(v_order);
END;
$$;

-- Consulta pública do pedido (o UUID do pedido funciona como token de acesso).
CREATE OR REPLACE FUNCTION public.get_public_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.pavox_order_public_json(o) FROM public.orders o WHERE o.id = p_order_id
$$;
REVOKE ALL ON FUNCTION public.get_public_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Webhooks: registro idempotente + transição de status
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT '',
  user_id UUID,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'received',
  result TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT webhook_events_provider_event_key UNIQUE (provider, event_id)
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
GRANT ALL ON public.webhook_events TO service_role;
CREATE INDEX IF NOT EXISTS webhook_events_order_idx ON public.webhook_events (order_id);

-- Taxa da plataforma: percentual do plano atual (padrão Free), 2 casas, meio para cima.
CREATE OR REPLACE FUNCTION public.pavox_platform_fee(p_user_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT round(p_amount * coalesce(
    (SELECT pl.transaction_fee_percent FROM public.subscriptions s
       JOIN public.plans pl ON pl.id = s.plan_id
      WHERE s.user_id = p_user_id AND s.status = 'active'),
    (SELECT pl.transaction_fee_percent FROM public.plans pl WHERE pl.slug = 'free'),
    0) / 100, 2)
$$;

-- Aplica o estado confirmado no gateway (consultado server-to-server) ao pedido.
-- p_status: approved | pending | rejected | cancelled | expired | refunded
CREATE OR REPLACE FUNCTION public.pavox_apply_payment_status(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_order_id uuid,
  p_payment_id text,
  p_status text,
  p_amount numeric,
  p_currency text,
  p_payload jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_id uuid;
  v_event_status text;
  v_order public.orders;
  v_next text;
  v_result text;
BEGIN
  INSERT INTO public.webhook_events (provider, event_id, event_type, user_id, order_id, payload)
  VALUES (p_provider, p_event_id, coalesce(p_event_type, ''), p_user_id, p_order_id, coalesce(p_payload, '{}'::jsonb))
  ON CONFLICT (provider, event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    SELECT id, status INTO v_event_id, v_event_status FROM public.webhook_events
    WHERE provider = p_provider AND event_id = p_event_id FOR UPDATE;
    IF v_event_status = 'processed' THEN
      RETURN 'duplicate';
    END IF;
  END IF;

  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id AND user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    v_result := 'order_not_found';
  ELSIF v_order.gateway_payment_id IS NOT NULL AND v_order.gateway_payment_id <> p_payment_id THEN
    v_result := 'payment_mismatch';
  ELSIF p_amount IS DISTINCT FROM v_order.amount OR upper(coalesce(p_currency, '')) <> v_order.currency THEN
    v_result := 'amount_mismatch';
  ELSE
    v_next := CASE
      WHEN p_status = 'approved' AND v_order.status IN ('Pendente', 'Expirado', 'Cancelado') THEN 'Aprovado'
      WHEN p_status = 'rejected' AND v_order.status = 'Pendente' THEN 'Recusado'
      WHEN p_status = 'cancelled' AND v_order.status = 'Pendente' THEN 'Cancelado'
      WHEN p_status = 'expired' AND v_order.status = 'Pendente' THEN 'Expirado'
      WHEN p_status = 'refunded' AND v_order.status = 'Aprovado' THEN 'Reembolsado'
      ELSE NULL
    END;

    IF v_next IS NULL THEN
      v_result := 'no_change';
    ELSE
      UPDATE public.orders
         SET status = v_next,
             gateway = coalesce(gateway, p_provider),
             gateway_payment_id = coalesce(gateway_payment_id, p_payment_id),
             paid_at = CASE WHEN v_next = 'Aprovado' THEN now() ELSE paid_at END,
             platform_fee = CASE WHEN v_next = 'Aprovado'
                                 THEN public.pavox_platform_fee(user_id, amount) ELSE platform_fee END
       WHERE id = v_order.id;

      IF v_next = 'Aprovado' THEN
        UPDATE public.products
           SET inventory_quantity = inventory_quantity - v_order.quantity
         WHERE id = v_order.product_id AND track_inventory;
      ELSIF v_next = 'Reembolsado' THEN
        UPDATE public.products
           SET inventory_quantity = inventory_quantity + v_order.quantity
         WHERE id = v_order.product_id AND track_inventory;
      END IF;
      v_result := 'order_' || lower(v_next);
    END IF;
  END IF;

  UPDATE public.webhook_events
     SET status = CASE WHEN v_result IN ('order_not_found', 'payment_mismatch', 'amount_mismatch')
                       THEN 'rejected' ELSE 'processed' END,
         result = v_result,
         order_id = CASE WHEN v_order.id IS NULL THEN NULL ELSE v_order.id END,
         processed_at = now()
   WHERE id = v_event_id;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- Permissões: funções internas só para o service_role
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.pavox_save_integration(uuid, text, text, text[], jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_get_integration_credentials(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_record_integration_test(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_order_for_payment(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_attach_payment(uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_apply_payment_status(text, text, text, uuid, uuid, text, text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_save_integration(uuid, text, text, text[], jsonb, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_get_integration_credentials(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_record_integration_test(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_order_for_payment(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_attach_payment(uuid, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_apply_payment_status(text, text, text, uuid, uuid, text, text, numeric, text, jsonb) TO service_role;

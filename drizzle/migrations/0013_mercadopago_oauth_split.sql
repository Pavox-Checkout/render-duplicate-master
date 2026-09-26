-- Mercado Pago: conexão por OAuth ("Conectar com Mercado Pago") e split da taxa PAVOX.
--
-- * payment_integrations ganha o tipo de conexão (manual | oauth), a conta do
--   vendedor no gateway e a validade do token (renovado pelo backend).
-- * integration_oauth_states guarda o "state" do fluxo OAuth (só o hash, uso
--   único, 10 minutos) — protege contra CSRF e liga o retorno ao lojista.
-- * orders.fee_collection diz como a taxa foi cobrada: 'split' (retida pelo
--   Mercado Pago via marketplace_fee) ou 'invoice' (cobrança posterior).

-- ---------------------------------------------------------------------------
-- Integrações: tipo de conexão
-- ---------------------------------------------------------------------------
ALTER TABLE public.payment_integrations
  ADD COLUMN IF NOT EXISTS connection_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_account_id TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE public.payment_integrations
    ADD CONSTRAINT payment_integrations_connection_type_check CHECK (connection_type IN ('manual', 'oauth'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT (connection_type, token_expires_at) ON public.payment_integrations TO authenticated;

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
    'account_label', i.account_label, 'connection_type', i.connection_type,
    'token_expires_at', i.token_expires_at, 'created_at', i.created_at, 'updated_at', i.updated_at)
$$;

DROP FUNCTION IF EXISTS public.pavox_save_integration(uuid, text, text, text[], jsonb, jsonb, text);

-- Grava/atualiza a integração já validada no gateway. Segredo vai para o Vault.
CREATE OR REPLACE FUNCTION public.pavox_save_integration(
  p_user_id uuid,
  p_provider text,
  p_environment text,
  p_methods text[],
  p_credentials jsonb,
  p_masked jsonb,
  p_account_label text,
  p_connection_type text DEFAULT 'manual',
  p_external_account_id text DEFAULT NULL,
  p_token_expires_at timestamptz DEFAULT NULL
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
    credentials_masked, credentials_secret_id, account_label, last_tested_at, last_test_status,
    connection_type, external_account_id, token_expires_at, updated_at
  ) VALUES (
    p_user_id, p_provider, p_environment, 'connected', p_methods, '{}'::jsonb,
    p_masked, v_secret, coalesce(p_account_label, ''), now(), 'connected',
    p_connection_type, p_external_account_id, p_token_expires_at, now()
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
    connection_type = EXCLUDED.connection_type,
    external_account_id = EXCLUDED.external_account_id,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN public.pavox_integration_public_json(v_row);
END;
$$;

-- Troca só o segredo (renovação do token OAuth), mantendo o resto da integração.
CREATE OR REPLACE FUNCTION public.pavox_update_integration_credentials(
  p_user_id uuid,
  p_provider text,
  p_credentials jsonb,
  p_token_expires_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_row public.payment_integrations;
BEGIN
  SELECT * INTO v_row FROM public.payment_integrations
  WHERE user_id = p_user_id AND provider = p_provider FOR UPDATE;
  IF NOT FOUND OR v_row.credentials_secret_id IS NULL THEN
    RAISE EXCEPTION 'integration_not_found';
  END IF;
  PERFORM vault.update_secret(v_row.credentials_secret_id, p_credentials::text);
  UPDATE public.payment_integrations
     SET token_expires_at = p_token_expires_at, updated_at = now()
   WHERE id = v_row.id;
END;
$$;

-- ---------------------------------------------------------------------------
-- OAuth: state de uso único
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_oauth_states (
  state_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  return_origin TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '10 minutes',
  used_at TIMESTAMPTZ
);
ALTER TABLE public.integration_oauth_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_oauth_states FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.integration_oauth_states TO service_role;
CREATE INDEX IF NOT EXISTS integration_oauth_states_expires_idx ON public.integration_oauth_states (expires_at);

-- Marca o state como usado e devolve a quem pertence (NULL se inválido/expirado/já usado).
CREATE OR REPLACE FUNCTION public.pavox_consume_oauth_state(p_state_hash text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.integration_oauth_states
     SET used_at = now()
   WHERE state_hash = p_state_hash AND used_at IS NULL AND expires_at > now()
  RETURNING jsonb_build_object('user_id', user_id, 'provider', provider, 'return_origin', return_origin)
$$;

-- ---------------------------------------------------------------------------
-- Pedidos: como a taxa PAVOX foi cobrada
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fee_collection TEXT;
DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_fee_collection_check CHECK (fee_collection IS NULL OR fee_collection IN ('split', 'invoice'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
    'provider', public.pavox_gateway_for_method(o.user_id, o.payment_method),
    'platform_fee_quote', public.pavox_platform_fee(o.user_id, o.amount))
  FROM public.orders o
  JOIN public.profiles p ON p.id = o.user_id
  WHERE o.id = p_order_id
$$;

DROP FUNCTION IF EXISTS public.pavox_attach_payment(uuid, text, text, jsonb);

-- Associa a cobrança criada no gateway ao pedido (uma única vez), com a taxa fixada.
CREATE OR REPLACE FUNCTION public.pavox_attach_payment(
  p_order_id uuid,
  p_gateway text,
  p_payment_id text,
  p_payment_data jsonb,
  p_platform_fee numeric DEFAULT NULL,
  p_fee_collection text DEFAULT NULL
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
         expires_at = coalesce((p_payment_data ->> 'expires_at')::timestamptz, expires_at),
         platform_fee = coalesce(p_platform_fee, platform_fee),
         fee_collection = coalesce(p_fee_collection, fee_collection)
   WHERE id = p_order_id AND gateway_payment_id IS NULL
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  END IF;
  RETURN public.pavox_order_public_json(v_order);
END;
$$;

-- Aprovação: com split, mantém a taxa retida; sem split, calcula pelo plano.
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
             -- Split: a taxa já foi retida pelo Mercado Pago no valor fixado na cobrança.
             platform_fee = CASE WHEN v_next = 'Aprovado' AND fee_collection IS DISTINCT FROM 'split'
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
REVOKE ALL ON FUNCTION public.pavox_save_integration(uuid, text, text, text[], jsonb, jsonb, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_update_integration_credentials(uuid, text, jsonb, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_consume_oauth_state(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_order_for_payment(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_attach_payment(uuid, text, text, jsonb, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_apply_payment_status(text, text, text, uuid, uuid, text, text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_save_integration(uuid, text, text, text[], jsonb, jsonb, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_update_integration_credentials(uuid, text, jsonb, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_consume_oauth_state(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_order_for_payment(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_attach_payment(uuid, text, text, jsonb, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_apply_payment_status(text, text, text, uuid, uuid, text, text, numeric, text, jsonb) TO service_role;

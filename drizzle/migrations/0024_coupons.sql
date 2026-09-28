-- Cupons de desconto reais.
-- O lojista cria cupons no painel (RLS por dono). O comprador digita o código no
-- checkout; o desconto é SEMPRE calculado no servidor, dentro de
-- create_public_order, e o valor cobrado no gateway já sai com desconto.
-- O uso é contado quando o pedido vira "Aprovado" (gatilho em orders).

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  code text NOT NULL CHECK (code ~ '^[A-Z0-9_-]{3,32}$'),
  type text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value numeric(12, 2) NOT NULL CHECK (value > 0),
  minimum_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (minimum_amount >= 0),
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_percent_max CHECK (type <> 'percent' OR value <= 100),
  CONSTRAINT coupons_period CHECK (starts_at IS NULL OR expires_at IS NULL OR expires_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_user_code_key ON public.coupons (user_id, code);
CREATE INDEX IF NOT EXISTS coupons_user_created_idx ON public.coupons (user_id, created_at DESC);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coupons_owner_select ON public.coupons;
CREATE POLICY coupons_owner_select ON public.coupons FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS coupons_owner_insert ON public.coupons;
CREATE POLICY coupons_owner_insert ON public.coupons FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS coupons_owner_update ON public.coupons;
CREATE POLICY coupons_owner_update ON public.coupons FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS coupons_owner_delete ON public.coupons;
CREATE POLICY coupons_owner_delete ON public.coupons FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- O contador de usos só muda pelo servidor.
REVOKE ALL ON public.coupons FROM anon;
REVOKE INSERT, UPDATE ON public.coupons FROM authenticated;
GRANT SELECT, DELETE ON public.coupons TO authenticated;
GRANT INSERT (user_id, code, type, value, minimum_amount, max_uses, starts_at, expires_at, active)
  ON public.coupons TO authenticated;
GRANT UPDATE (code, type, value, minimum_amount, max_uses, starts_at, expires_at, active, updated_at)
  ON public.coupons TO authenticated;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coupon_code text;
CREATE INDEX IF NOT EXISTS orders_coupon_idx ON public.orders (coupon_id) WHERE coupon_id IS NOT NULL;

-- Calcula o desconto de um cupom para um valor. Levanta o motivo quando não vale.
-- O total nunca fica abaixo de R$ 1,00 (mínimo aceito pelos gateways).
CREATE OR REPLACE FUNCTION public.pavox_coupon_quote(p_user_id uuid, p_code text, p_price numeric)
RETURNS TABLE (coupon_id uuid, code text, discount numeric, amount numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_coupon public.coupons;
  v_code text := upper(trim(coalesce(p_code, '')));
  v_discount numeric;
BEGIN
  IF v_code = '' THEN RAISE EXCEPTION 'coupon_invalid'; END IF;

  SELECT * INTO v_coupon FROM public.coupons c
  WHERE c.user_id = p_user_id AND c.code = v_code;
  IF NOT FOUND OR NOT v_coupon.active THEN RAISE EXCEPTION 'coupon_invalid'; END IF;
  IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
    RAISE EXCEPTION 'coupon_not_started';
  END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
    RAISE EXCEPTION 'coupon_expired';
  END IF;
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'coupon_exhausted';
  END IF;
  IF p_price < v_coupon.minimum_amount THEN RAISE EXCEPTION 'coupon_minimum'; END IF;

  v_discount := CASE
    WHEN v_coupon.type = 'percent' THEN round(p_price * v_coupon.value / 100, 2)
    ELSE v_coupon.value
  END;
  v_discount := least(v_discount, greatest(p_price - 1.00, 0));

  RETURN QUERY SELECT v_coupon.id, v_coupon.code, v_discount, p_price - v_discount;
END;
$$;

REVOKE ALL ON FUNCTION public.pavox_coupon_quote(uuid, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_coupon_quote(uuid, text, numeric) TO service_role;

-- Consulta pública do checkout: o comprador vê o desconto antes de pagar.
-- Não revela nada além do próprio código digitado.
CREATE OR REPLACE FUNCTION public.check_public_coupon(p_checkout_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_checkout public.checkouts;
  v_product public.products;
  v_price numeric;
  v_quote record;
BEGIN
  SELECT * INTO v_checkout FROM public.checkouts WHERE id = p_checkout_id AND published;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'reason', 'checkout_not_found'); END IF;

  SELECT * INTO v_product FROM public.products
  WHERE id = public.pavox_checkout_product_id(v_checkout) AND status = 'Ativo';
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'reason', 'product_unavailable'); END IF;

  v_price := public.pavox_product_charge_price(v_product);
  BEGIN
    SELECT * INTO v_quote FROM public.pavox_coupon_quote(v_checkout.user_id, p_code, v_price);
  EXCEPTION WHEN raise_exception THEN
    RETURN jsonb_build_object('valid', false, 'reason', SQLERRM);
  END;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_quote.code,
    'subtotal', v_price,
    'discount', v_quote.discount,
    'amount', v_quote.amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_public_coupon(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_public_coupon(uuid, text) TO anon, authenticated;

-- O checkout só mostra o campo de cupom quando a loja tem algum cupom ativo.
CREATE OR REPLACE FUNCTION public.public_checkout_has_coupons(p_checkout_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.checkouts ch
    JOIN public.coupons c ON c.user_id = ch.user_id
    WHERE ch.id = p_checkout_id AND ch.published AND c.active
      AND (c.expires_at IS NULL OR c.expires_at > now())
      AND (c.max_uses IS NULL OR c.uses < c.max_uses)
  );
$$;

REVOKE ALL ON FUNCTION public.public_checkout_has_coupons(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_checkout_has_coupons(uuid) TO anon, authenticated;

-- Conta o uso quando o pagamento é aprovado (uma vez por pedido).
CREATE OR REPLACE FUNCTION public.pavox_count_coupon_use()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.coupon_id IS NOT NULL AND NEW.status = 'Aprovado' AND OLD.status IS DISTINCT FROM 'Aprovado' THEN
    UPDATE public.coupons SET uses = uses + 1, updated_at = now() WHERE id = NEW.coupon_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pavox_count_coupon_use() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_count_coupon_use ON public.orders;
CREATE TRIGGER orders_count_coupon_use
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.pavox_count_coupon_use();

-- create_public_order ganha o código do cupom (opcional).
DROP FUNCTION IF EXISTS public.create_public_order(uuid, jsonb, text, uuid);

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_checkout_id uuid,
  p_buyer jsonb,
  p_payment_method text,
  p_idempotency_key uuid,
  p_coupon_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing public.orders;
  v_checkout public.checkouts;
  v_product public.products;
  v_order public.orders;
  v_customer_id uuid;
  v_price numeric;
  v_amount numeric;
  v_discount numeric := 0;
  v_coupon_id uuid;
  v_coupon_code text;
  v_person text;
  v_email text;
  v_name text;
  v_phone text;
  v_doc text;
  v_address jsonb := '{}'::jsonb;
  v_needs_address boolean;
  v_needs_document boolean;
  v_provider text;
BEGIN
  IF p_checkout_id IS NULL OR p_idempotency_key IS NULL OR p_buyer IS NULL
     OR jsonb_typeof(p_buyer) <> 'object' THEN
    RAISE EXCEPTION 'invalid_request';
  END IF;

  -- Idempotência: mesmo envio (duplo clique / retry) devolve o mesmo pedido.
  SELECT * INTO v_existing FROM public.orders WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.checkout_id IS DISTINCT FROM p_checkout_id THEN
      RAISE EXCEPTION 'idempotency_conflict';
    END IF;
    RETURN public.pavox_order_public_json(v_existing);
  END IF;

  SELECT * INTO v_checkout FROM public.checkouts WHERE id = p_checkout_id AND published;
  IF NOT FOUND THEN RAISE EXCEPTION 'checkout_not_found'; END IF;

  SELECT * INTO v_product FROM public.products
  WHERE id = public.pavox_checkout_product_id(v_checkout) AND status = 'Ativo';
  IF NOT FOUND THEN RAISE EXCEPTION 'product_unavailable'; END IF;

  IF v_product.track_inventory AND NOT v_product.allow_backorder AND v_product.inventory_quantity < 1 THEN
    RAISE EXCEPTION 'out_of_stock';
  END IF;

  IF p_payment_method IS NULL
     OR NOT (p_payment_method = ANY (public.pavox_checkout_payment_methods(v_checkout))) THEN
    RAISE EXCEPTION 'payment_method_unavailable';
  END IF;

  v_person := CASE WHEN p_buyer ->> 'person_type' = 'pj' THEN 'pj' ELSE 'pf' END;
  v_email := lower(trim(coalesce(p_buyer ->> 'email', '')));
  v_name := trim(coalesce(p_buyer ->> 'name', ''));
  v_phone := regexp_replace(coalesce(p_buyer ->> 'phone', ''), '\D', '', 'g');
  v_doc := regexp_replace(coalesce(p_buyer ->> 'document', ''), '\D', '', 'g');

  IF length(v_email) > 254 OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF length(v_name) < 2 OR length(v_name) > 200 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  IF length(v_phone) > 20 THEN RAISE EXCEPTION 'invalid_phone'; END IF;
  IF v_doc <> '' AND length(v_doc) NOT IN (11, 14) THEN RAISE EXCEPTION 'invalid_document'; END IF;

  -- Boleto exige documento e endereço completo (com bairro), mesmo em produto digital.
  -- Vários gateways exigem CPF/CNPJ (e alguns telefone) em toda cobrança.
  v_provider := public.pavox_gateway_for_method(v_checkout.user_id, p_payment_method);
  v_needs_document := p_payment_method = 'boleto' OR public.pavox_provider_requires_document(v_provider);
  IF v_needs_document AND length(v_doc) NOT IN (11, 14) THEN
    RAISE EXCEPTION 'invalid_document';
  END IF;
  IF public.pavox_provider_requires_phone(v_provider) AND length(v_phone) < 10 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  v_needs_address := v_product.type = 'fisico' OR p_payment_method = 'boleto';

  IF v_needs_address THEN
    IF jsonb_typeof(p_buyer -> 'address') IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'invalid_address';
    END IF;
    v_address := jsonb_build_object(
      'zip', regexp_replace(coalesce(p_buyer -> 'address' ->> 'zip', ''), '\D', '', 'g'),
      'street', left(trim(coalesce(p_buyer -> 'address' ->> 'street', '')), 200),
      'number', left(trim(coalesce(p_buyer -> 'address' ->> 'number', '')), 20),
      'complement', left(trim(coalesce(p_buyer -> 'address' ->> 'complement', '')), 100),
      'neighborhood', left(trim(coalesce(p_buyer -> 'address' ->> 'neighborhood', '')), 100),
      'city', left(trim(coalesce(p_buyer -> 'address' ->> 'city', '')), 100),
      'state', upper(left(trim(coalesce(p_buyer -> 'address' ->> 'state', '')), 2))
    );
    IF length(v_address ->> 'zip') <> 8 OR v_address ->> 'street' = '' OR v_address ->> 'number' = ''
       OR v_address ->> 'city' = '' OR length(v_address ->> 'state') <> 2
       OR (p_payment_method = 'boleto' AND v_address ->> 'neighborhood' = '') THEN
      RAISE EXCEPTION 'invalid_address';
    END IF;
  END IF;

  v_price := public.pavox_product_charge_price(v_product);
  v_amount := v_price;

  -- Cupom: validado e calculado aqui, nunca no navegador.
  IF nullif(trim(coalesce(p_coupon_code, '')), '') IS NOT NULL THEN
    SELECT q.coupon_id, q.code, q.discount, q.amount
      INTO v_coupon_id, v_coupon_code, v_discount, v_amount
      FROM public.pavox_coupon_quote(v_checkout.user_id, p_coupon_code, v_price) q;
  END IF;

  INSERT INTO public.customers AS cu (user_id, name, email, phone, document, person_type, address)
  VALUES (v_checkout.user_id, v_name, v_email, v_phone, v_doc, v_person, v_address)
  ON CONFLICT (user_id, lower(email)) WHERE email <> '' DO UPDATE SET
    name = EXCLUDED.name,
    phone = coalesce(nullif(EXCLUDED.phone, ''), cu.phone),
    document = coalesce(nullif(EXCLUDED.document, ''), cu.document),
    person_type = EXCLUDED.person_type,
    address = CASE WHEN EXCLUDED.address = '{}'::jsonb THEN cu.address ELSE EXCLUDED.address END,
    updated_at = now()
  RETURNING cu.id INTO v_customer_id;

  INSERT INTO public.orders (
    user_id, reference, customer_id, product_id, checkout_id,
    quantity, subtotal, discount, amount, status, payment_method, idempotency_key,
    buyer, product_snapshot, expires_at, coupon_id, coupon_code
  ) VALUES (
    v_checkout.user_id,
    'PVX-' || upper(substr(md5(gen_random_uuid()::text), 1, 8)),
    v_customer_id, v_product.id, v_checkout.id,
    1, v_price, v_discount, v_amount, 'Pendente', p_payment_method, p_idempotency_key,
    jsonb_build_object('name', v_name, 'email', v_email, 'phone', v_phone,
                       'document', v_doc, 'person_type', v_person, 'address', v_address),
    jsonb_build_object('id', v_product.id, 'name', v_product.name,
                       'type', v_product.type, 'unit_price', v_price),
    -- Pix vence em 30 min; boleto em até 3 dias úteis (o gateway devolve a data exata).
    now() + CASE WHEN p_payment_method = 'boleto' THEN interval '5 days' ELSE interval '30 minutes' END,
    v_coupon_id, v_coupon_code
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE idempotency_key = p_idempotency_key;
  END IF;

  RETURN public.pavox_order_public_json(v_order);
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_order(uuid, jsonb, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order(uuid, jsonb, text, uuid, text) TO service_role;

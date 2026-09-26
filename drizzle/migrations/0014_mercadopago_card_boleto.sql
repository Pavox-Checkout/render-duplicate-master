-- Mercado Pago: cartão de crédito e boleto além do Pix.
--
-- * pavox_provider_methods: mercadopago → {pix, card, boleto}.
-- * create_public_order: boleto exige CPF/CNPJ e endereço completo com bairro
--   (também para produto digital); endereço guarda o bairro.
-- * Integrações Mercado Pago existentes passam a ter cartão e boleto
--   habilitados (o checkout continua decidindo o que oferecer).

CREATE OR REPLACE FUNCTION public.pavox_provider_methods(p_provider text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_provider
    WHEN 'mercadopago' THEN '{pix,card,boleto}'::text[]
    ELSE '{}'::text[]
  END
$$;

UPDATE public.payment_integrations
   SET enabled_payment_methods = ARRAY(
         SELECT DISTINCT m FROM unnest(enabled_payment_methods || '{card,boleto}'::text[]) AS m ORDER BY m),
       updated_at = now()
 WHERE provider = 'mercadopago';

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_checkout_id uuid,
  p_buyer jsonb,
  p_payment_method text,
  p_idempotency_key uuid
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
  v_person text;
  v_email text;
  v_name text;
  v_phone text;
  v_doc text;
  v_address jsonb := '{}'::jsonb;
  v_needs_address boolean;
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
  IF p_payment_method = 'boleto' AND length(v_doc) NOT IN (11, 14) THEN
    RAISE EXCEPTION 'invalid_document';
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

  v_price := public.pavox_product_charge_price(v_product);

  INSERT INTO public.orders (
    user_id, reference, customer_id, product_id, checkout_id,
    quantity, subtotal, amount, status, payment_method, idempotency_key,
    buyer, product_snapshot, expires_at
  ) VALUES (
    v_checkout.user_id,
    'PVX-' || upper(substr(md5(gen_random_uuid()::text), 1, 8)),
    v_customer_id, v_product.id, v_checkout.id,
    1, v_price, v_price, 'Pendente', p_payment_method, p_idempotency_key,
    jsonb_build_object('name', v_name, 'email', v_email, 'phone', v_phone,
                       'document', v_doc, 'person_type', v_person, 'address', v_address),
    jsonb_build_object('id', v_product.id, 'name', v_product.name,
                       'type', v_product.type, 'unit_price', v_price),
    -- Pix vence em 30 min; boleto em até 3 dias úteis (o gateway devolve a data exata).
    now() + CASE WHEN p_payment_method = 'boleto' THEN interval '5 days' ELSE interval '30 minutes' END
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE idempotency_key = p_idempotency_key;
  END IF;

  RETURN public.pavox_order_public_json(v_order);
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_order(uuid, jsonb, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order(uuid, jsonb, text, uuid) TO service_role;

-- 0010_public_checkout_orders.sql
--
-- Sprint 1 do fluxo de venda: checkout público, slugs por loja, clientes e pedidos.
--
-- URL pública: /c/{profiles.store_slug}/{checkouts.slug}
-- Leitura pública: get_public_checkout() (SECURITY DEFINER, só checkouts publicados).
-- Criação de pedido: create_public_order() — executável apenas pelo service_role
-- (Edge Function `public-checkout`). O preço vem SEMPRE do banco.

-- ---------------------------------------------------------------------------
-- Slug helper (sem depender da extensão unaccent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pavox_slugify(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT trim(both '-' FROM regexp_replace(
    translate(lower(coalesce(value, '')),
      'áàâãäåçéèêëíìîïñóòôõöúùûüýÿ',
      'aaaaaaceeeeiiiinooooouuuuyy'),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- ---------------------------------------------------------------------------
-- Slug da loja (profiles.store_slug) — único globalmente
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_slug text;

CREATE OR REPLACE FUNCTION public.pavox_unique_store_slug(p_base text, p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  base text := left(public.pavox_slugify(p_base), 48);
  candidate text;
BEGIN
  base := trim(both '-' FROM base);
  IF length(base) < 3 THEN
    base := 'loja' || CASE WHEN base = '' THEN '' ELSE '-' || base END;
  END IF;
  candidate := base;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE store_slug = candidate AND id <> p_profile_id) THEN
    candidate := base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
  END IF;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_set_store_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.store_slug IS NULL OR NEW.store_slug = '' THEN
    NEW.store_slug := public.pavox_unique_store_slug(
      coalesce(nullif(NEW.company_name, ''), nullif(NEW.full_name, ''), split_part(NEW.email, '@', 1), 'loja'),
      NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_store_slug ON public.profiles;
CREATE TRIGGER profiles_store_slug
  BEFORE INSERT OR UPDATE OF store_slug ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_set_store_slug();

-- Backfill linha a linha (cada UPDATE enxerga os slugs já gerados).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE store_slug IS NULL OR store_slug = '' ORDER BY created_at LOOP
    UPDATE public.profiles SET store_slug = NULL WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.profiles ALTER COLUMN store_slug SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_store_slug_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_store_slug_key UNIQUE (store_slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_store_slug_format') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_store_slug_format
      CHECK (store_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(store_slug) BETWEEN 3 AND 60);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Slug do checkout — único por loja e estável (não muda ao renomear)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.checkouts_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  base text;
  candidate text;
  n integer := 2;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.slug IS NULL OR NEW.slug = '' OR NEW.slug = OLD.slug THEN
      NEW.slug := OLD.slug;
      RETURN NEW;
    END IF;
  END IF;

  base := left(public.pavox_slugify(coalesce(nullif(NEW.slug, ''), NEW.name)), 60);
  base := trim(both '-' FROM base);
  IF base = '' THEN base := 'checkout'; END IF;

  candidate := base;
  WHILE EXISTS (
    SELECT 1 FROM public.checkouts
    WHERE user_id = NEW.user_id AND slug = candidate AND id <> NEW.id
  ) LOOP
    candidate := base || '-' || n;
    n := n + 1;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS checkouts_slug ON public.checkouts;
CREATE TRIGGER checkouts_slug
  BEFORE INSERT OR UPDATE OF slug ON public.checkouts
  FOR EACH ROW EXECUTE FUNCTION public.checkouts_set_slug();

CREATE UNIQUE INDEX IF NOT EXISTS checkouts_user_slug_key ON public.checkouts (user_id, slug);

-- ---------------------------------------------------------------------------
-- Clientes: um registro por (loja, e-mail)
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS document TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS person_type TEXT NOT NULL DEFAULT 'pf',
  ADD COLUMN IF NOT EXISTS address JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS customers_user_email_key
  ON public.customers (user_id, lower(email)) WHERE email <> '';

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS gateway TEXT,
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS buyer JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS product_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('Pendente', 'Aprovado', 'Recusado', 'Cancelado', 'Reembolsado', 'Expirado'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_key
  ON public.orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_gateway_payment_key
  ON public.orders (gateway, gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_status_idx ON public.orders (user_id, status);

DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Pedidos, clientes e taxas só são escritos pelo backend (service_role).
-- O lojista lê os seus; nunca marca um pedido como pago pelo navegador.
DROP POLICY IF EXISTS "own orders" ON public.orders;
DROP POLICY IF EXISTS "own orders read" ON public.orders;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM authenticated;

DROP POLICY IF EXISTS "own customers" ON public.customers;
DROP POLICY IF EXISTS "own customers read" ON public.customers;
CREATE POLICY "own customers read" ON public.customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.customers FROM authenticated;

DROP POLICY IF EXISTS "own transaction fees" ON public.transaction_fees;
DROP POLICY IF EXISTS "own transaction fees read" ON public.transaction_fees;
CREATE POLICY "own transaction fees read" ON public.transaction_fees FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.transaction_fees FROM authenticated;

DROP POLICY IF EXISTS "own billing records" ON public.billing_records;
DROP POLICY IF EXISTS "own billing records read" ON public.billing_records;
CREATE POLICY "own billing records read" ON public.billing_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.billing_records FROM authenticated;

-- ---------------------------------------------------------------------------
-- Regras de negócio compartilhadas
-- ---------------------------------------------------------------------------

-- Preço cobrado: promocional válido, senão o preço cheio.
CREATE OR REPLACE FUNCTION public.pavox_product_charge_price(p public.products)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p.promotional_price IS NOT NULL AND p.promotional_price > 0 AND p.promotional_price < p.price
      THEN p.promotional_price
    ELSE p.price
  END
$$;

-- Produto vendido pelo checkout: checkouts.product_id; senão o primeiro produto
-- vinculado via products.checkout_id (mesmo lojista).
CREATE OR REPLACE FUNCTION public.pavox_checkout_product_id(p_checkout public.checkouts)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT p.id FROM public.products p
      WHERE p.id = p_checkout.product_id AND p.user_id = p_checkout.user_id),
    (SELECT p.id FROM public.products p
      WHERE p.checkout_id = p_checkout.id AND p.user_id = p_checkout.user_id
      ORDER BY p.created_at LIMIT 1)
  )
$$;

-- Gateways com adaptador implementado no backend. Enquanto a lista estiver
-- vazia, nenhum método de pagamento é oferecido (sem sucesso falso).
CREATE OR REPLACE FUNCTION public.pavox_supported_payment_providers()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT '{}'::text[] $$;

-- Métodos oferecidos = ativados no checkout ∩ ativados numa integração conectada
-- de gateway suportado.
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
    AND i.provider = ANY (public.pavox_supported_payment_providers())
    AND coalesce((p_checkout.config -> 'payment' ->> m)::boolean, false)
$$;

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
    'paid_at', o.paid_at
  )
$$;

-- ---------------------------------------------------------------------------
-- Leitura pública do checkout
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_checkout(p_store_slug text, p_checkout_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles;
  v_checkout public.checkouts;
  v_product public.products;
  v_product_id uuid;
  v_price numeric;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE store_slug = lower(p_store_slug);
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_checkout FROM public.checkouts
  WHERE user_id = v_profile.id AND slug = lower(p_checkout_slug) AND published;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_product_id := public.pavox_checkout_product_id(v_checkout);
  IF v_product_id IS NOT NULL THEN
    SELECT * INTO v_product FROM public.products WHERE id = v_product_id AND status = 'Ativo';
  END IF;
  v_price := CASE WHEN v_product.id IS NULL THEN NULL ELSE public.pavox_product_charge_price(v_product) END;

  RETURN jsonb_build_object(
    'checkout', jsonb_build_object(
      'id', v_checkout.id,
      'name', v_checkout.name,
      'slug', v_checkout.slug,
      'config', v_checkout.config
    ),
    'store', jsonb_build_object(
      'slug', v_profile.store_slug,
      'name', v_profile.company_name
    ),
    'product', CASE WHEN v_product.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'description', v_product.description,
      'type', v_product.type,
      'price', v_price,
      'compare_at', CASE WHEN v_price < v_product.price THEN v_product.price ELSE NULL END,
      'image', nullif(v_product.main_image, ''),
      'available', NOT (v_product.track_inventory AND NOT v_product.allow_backorder
                        AND v_product.inventory_quantity < 1)
    ) END,
    'payment_methods', to_jsonb(public.pavox_checkout_payment_methods(v_checkout))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_checkout(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_checkout(text, text) TO anon, authenticated;

-- Imagem principal de produto vendido em checkout publicado: legível publicamente
-- (necessário para o comprador ver a foto via URL assinada).
CREATE OR REPLACE FUNCTION public.pavox_is_public_product_image(p_name text)
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

REVOKE ALL ON FUNCTION public.pavox_is_public_product_image(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pavox_is_public_product_image(text) TO anon, authenticated;

DROP POLICY IF EXISTS "product images public for published checkouts" ON storage.objects;
CREATE POLICY "product images public for published checkouts" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images' AND public.pavox_is_public_product_image(name));

-- ---------------------------------------------------------------------------
-- Criação do pedido (somente service_role / Edge Function)
-- ---------------------------------------------------------------------------
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

  IF v_product.type = 'fisico' THEN
    IF jsonb_typeof(p_buyer -> 'address') IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'invalid_address';
    END IF;
    v_address := jsonb_build_object(
      'zip', regexp_replace(coalesce(p_buyer -> 'address' ->> 'zip', ''), '\D', '', 'g'),
      'street', left(trim(coalesce(p_buyer -> 'address' ->> 'street', '')), 200),
      'number', left(trim(coalesce(p_buyer -> 'address' ->> 'number', '')), 20),
      'complement', left(trim(coalesce(p_buyer -> 'address' ->> 'complement', '')), 100),
      'city', left(trim(coalesce(p_buyer -> 'address' ->> 'city', '')), 100),
      'state', upper(left(trim(coalesce(p_buyer -> 'address' ->> 'state', '')), 2))
    );
    IF length(v_address ->> 'zip') <> 8 OR v_address ->> 'street' = '' OR v_address ->> 'number' = ''
       OR v_address ->> 'city' = '' OR length(v_address ->> 'state') <> 2 THEN
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
    now() + interval '30 minutes'
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

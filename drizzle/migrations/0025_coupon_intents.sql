-- O comprador registra o cupom escolhido para a chave de idempotência do pedido
-- (gerada no navegador) antes de pagar. create_public_order lê esse registro e
-- valida o cupom no servidor, sem precisar mudar a Edge Function que cria o
-- pedido. O registro não concede nada: o desconto só existe se o cupom for
-- válido no momento da criação do pedido.

CREATE TABLE IF NOT EXISTS public.checkout_coupon_intents (
  idempotency_key uuid PRIMARY KEY,
  checkout_id uuid NOT NULL REFERENCES public.checkouts (id) ON DELETE CASCADE,
  code text NOT NULL CHECK (length(code) BETWEEN 1 AND 32),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_coupon_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_coupon_intents FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_public_coupon_intent(
  p_checkout_id uuid,
  p_idempotency_key uuid,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_check jsonb;
BEGIN
  IF p_checkout_id IS NULL OR p_idempotency_key IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_request');
  END IF;

  -- Um pedido já criado com essa chave não muda mais.
  IF EXISTS (SELECT 1 FROM public.orders WHERE idempotency_key = p_idempotency_key) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'order_exists');
  END IF;

  IF nullif(trim(coalesce(p_code, '')), '') IS NULL THEN
    DELETE FROM public.checkout_coupon_intents WHERE idempotency_key = p_idempotency_key;
    RETURN jsonb_build_object('valid', true, 'removed', true);
  END IF;

  v_check := public.check_public_coupon(p_checkout_id, p_code);
  IF NOT coalesce((v_check ->> 'valid')::boolean, false) THEN
    DELETE FROM public.checkout_coupon_intents WHERE idempotency_key = p_idempotency_key;
    RETURN v_check;
  END IF;

  INSERT INTO public.checkout_coupon_intents (idempotency_key, checkout_id, code)
  VALUES (p_idempotency_key, p_checkout_id, v_check ->> 'code')
  ON CONFLICT (idempotency_key) DO UPDATE
    SET code = EXCLUDED.code, checkout_id = EXCLUDED.checkout_id, created_at = now();

  -- Limpeza oportunista de intenções velhas (nunca viraram pedido).
  DELETE FROM public.checkout_coupon_intents WHERE created_at < now() - interval '2 days';

  RETURN v_check;
END;
$$;

REVOKE ALL ON FUNCTION public.set_public_coupon_intent(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_public_coupon_intent(uuid, uuid, text) TO anon, authenticated;

-- create_public_order passa a usar o cupom registrado para a chave quando o
-- código não vem como parâmetro.
DO $do$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef('public.create_public_order(uuid, jsonb, text, uuid, text)'::regprocedure) INTO v_def;
  IF position('checkout_coupon_intents' IN v_def) = 0 THEN
    v_def := replace(
      v_def,
      $a$  IF nullif(trim(coalesce(p_coupon_code, '')), '') IS NOT NULL THEN
    SELECT q.coupon_id, q.code, q.discount, q.amount
      INTO v_coupon_id, v_coupon_code, v_discount, v_amount
      FROM public.pavox_coupon_quote(v_checkout.user_id, p_coupon_code, v_price) q;
  END IF;$a$,
      $b$  v_coupon_code := nullif(trim(coalesce(p_coupon_code, '')), '');
  IF v_coupon_code IS NULL THEN
    SELECT i.code INTO v_coupon_code FROM public.checkout_coupon_intents i
    WHERE i.idempotency_key = p_idempotency_key AND i.checkout_id = p_checkout_id;
  END IF;
  IF v_coupon_code IS NOT NULL THEN
    SELECT q.coupon_id, q.code, q.discount, q.amount
      INTO v_coupon_id, v_coupon_code, v_discount, v_amount
      FROM public.pavox_coupon_quote(v_checkout.user_id, v_coupon_code, v_price) q;
  END IF;$b$
    );
    IF position('checkout_coupon_intents' IN v_def) = 0 THEN
      RAISE EXCEPTION 'create_public_order: trecho do cupom não encontrado';
    END IF;
    EXECUTE v_def;
  END IF;
END;
$do$;

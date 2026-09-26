-- E-mails ao comprador (pagamento confirmado / reembolso) e reembolso pelo painel.
--
-- orders.emails_sent guarda quando cada e-mail saiu ({"paid": ts, "refunded": ts}).
-- pavox_claim_order_email reserva o envio de forma atômica: dois avisos
-- simultâneos do gateway nunca geram dois e-mails. Se o envio falhar, a
-- reserva é liberada (pavox_release_order_email) para uma nova tentativa.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS emails_sent JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.pavox_claim_order_email(p_order_id uuid, p_kind text, p_force boolean DEFAULT false)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH claimed AS (
    UPDATE public.orders
       SET emails_sent = emails_sent || jsonb_build_object(p_kind, now())
     WHERE id = p_order_id
       AND p_kind IN ('paid', 'refunded')
       AND (p_force OR NOT (emails_sent ? p_kind))
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM claimed)
$$;

CREATE OR REPLACE FUNCTION public.pavox_release_order_email(p_order_id uuid, p_kind text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.orders SET emails_sent = emails_sent - p_kind WHERE id = p_order_id
$$;

REVOKE ALL ON FUNCTION public.pavox_claim_order_email(uuid, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_release_order_email(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_claim_order_email(uuid, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_release_order_email(uuid, text) TO service_role;

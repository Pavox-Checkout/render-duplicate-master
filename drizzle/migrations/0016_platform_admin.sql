-- Platform administration is independent of merchant/team roles. No user is
-- promoted automatically. Provision private.platform_admins using trusted SQL.
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.platform_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 3 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.platform_admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  merchant_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.platform_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.platform_admin_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.platform_admins, private.platform_admin_notes, private.platform_admin_audit FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.platform_admins, private.platform_admin_notes, private.platform_admin_audit TO service_role;
CREATE INDEX platform_admin_notes_merchant_idx ON private.platform_admin_notes (merchant_id, created_at DESC);
CREATE INDEX platform_admin_audit_created_idx ON private.platform_admin_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_admin_created_idx ON public.orders (created_at DESC, id);
CREATE INDEX IF NOT EXISTS orders_admin_paid_idx ON public.orders (paid_at) WHERE status = 'Aprovado';
CREATE INDEX IF NOT EXISTS webhook_events_admin_created_idx ON public.webhook_events (created_at DESC, id);

CREATE FUNCTION private.require_platform_admin(p_write boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM private.platform_admins WHERE user_id = auth.uid();
  IF v_role IS NULL OR (p_write AND v_role <> 'admin') THEN
    RAISE EXCEPTION 'platform_admin_required' USING ERRCODE = '42501';
  END IF;
  RETURN auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION private.require_platform_admin(boolean) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.pavox_admin_access()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('role', (SELECT role FROM private.platform_admins WHERE user_id = auth.uid()))
$$;

CREATE FUNCTION public.pavox_admin_overview(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_start timestamptz; v_today date; v_result jsonb;
BEGIN
  PERFORM private.require_platform_admin();
  IF p_days IS NULL OR p_days NOT IN (7, 30, 90) THEN RAISE EXCEPTION 'invalid_period'; END IF;
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_start := (v_today - (p_days - 1))::timestamp AT TIME ZONE 'America/Sao_Paulo';
  WITH paid AS MATERIALIZED (
    SELECT amount, platform_fee, paid_at FROM public.orders
    WHERE status = 'Aprovado' AND paid_at >= v_start AND paid_at <= now()
  ), daily AS (
    SELECT (paid_at AT TIME ZONE 'America/Sao_Paulo')::date AS day,
           sum(amount) AS amount, count(*) AS orders FROM paid GROUP BY 1
  ), series AS (
    SELECT (v_today - (p_days - 1) + n)::text AS day,
           coalesce(d.amount, 0) AS amount, coalesce(d.orders, 0) AS orders
    FROM generate_series(0, p_days - 1) AS n
    LEFT JOIN daily d ON d.day = v_today - (p_days - 1) + n ORDER BY n
  )
  SELECT jsonb_build_object(
    'from', v_start, 'to', now(),
    'volume', coalesce((SELECT sum(amount) FROM paid), 0),
    'fees', coalesce((SELECT sum(platform_fee) FROM paid), 0),
    'paid_orders', (SELECT count(*) FROM paid),
    'orders', (SELECT count(*) FROM public.orders WHERE created_at >= v_start AND created_at <= now()),
    'pending_orders', (SELECT count(*) FROM public.orders WHERE status = 'Pendente' AND created_at >= v_start AND created_at <= now()),
    'merchants', (SELECT count(*) FROM public.profiles),
    'new_merchants', (SELECT count(*) FROM public.profiles WHERE created_at >= v_start AND created_at <= now()),
    'published_checkouts', (SELECT count(*) FROM public.checkouts WHERE published),
    'integration_errors', (SELECT count(*) FROM public.payment_integrations WHERE status = 'error'),
    'webhook_rejections', (SELECT count(*) FROM public.webhook_events WHERE status = 'rejected' AND created_at >= v_start AND created_at <= now()),
    'series', (SELECT coalesce(jsonb_agg(to_jsonb(series)), '[]'::jsonb) FROM series)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- Explicit projections only: never return gateway credentials, Vault IDs,
-- payment data, buyer documents/addresses, or raw webhook payloads.
CREATE FUNCTION public.pavox_admin_list(
  p_kind text, p_query text DEFAULT '', p_status text DEFAULT '',
  p_page integer DEFAULT 1, p_days integer DEFAULT 30
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb; v_query text; v_start timestamptz; v_offset integer;
BEGIN
  PERFORM private.require_platform_admin();
  IF p_page IS NULL OR p_page NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'invalid_page'; END IF;
  IF p_days IS NULL OR p_days NOT IN (7, 30, 90) THEN RAISE EXCEPTION 'invalid_period'; END IF;
  IF length(coalesce(p_query, '')) > 120 THEN RAISE EXCEPTION 'query_too_long'; END IF;
  v_query := lower(btrim(coalesce(p_query, '')));
  v_offset := (p_page - 1) * 20;
  v_start := ((now() AT TIME ZONE 'America/Sao_Paulo')::date - (p_days - 1))::timestamp AT TIME ZONE 'America/Sao_Paulo';

  IF p_kind IN ('merchants', 'subscriptions') THEN
    WITH filtered AS MATERIALIZED (
      SELECT p.id, p.company_name, p.full_name, p.email, p.store_slug, p.created_at,
             coalesce(s.status, 'none') AS status, pl.name AS plan,
             pl.monthly_price, pl.transaction_fee_percent, s.current_period_end,
             (SELECT count(*) FROM public.checkouts c WHERE c.user_id = p.id AND c.published) AS published_checkouts
      FROM public.profiles p
      LEFT JOIN public.subscriptions s ON s.user_id = p.id
      LEFT JOIN public.plans pl ON pl.id = s.plan_id
      WHERE (v_query = '' OR strpos(lower(concat_ws(' ', p.company_name, p.full_name, p.email, p.store_slug)), v_query) > 0)
        AND (coalesce(p_status, '') = '' OR coalesce(s.status, 'none') = p_status)
    ), page AS (SELECT * FROM filtered ORDER BY created_at DESC, id LIMIT 20 OFFSET v_offset)
    SELECT jsonb_build_object('total', (SELECT count(*) FROM filtered),
      'rows', coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC, id) FROM page), '[]'::jsonb)) INTO v_result;
  ELSIF p_kind = 'transactions' THEN
    WITH filtered AS MATERIALIZED (
      SELECT o.id, o.reference, o.user_id, o.amount, o.platform_fee, o.currency,
             o.status, o.payment_method, o.gateway, o.created_at, o.paid_at,
             coalesce(nullif(p.company_name, ''), p.full_name, 'Loja removida') AS merchant,
             c.name AS customer, c.email AS customer_email
      FROM public.orders o LEFT JOIN public.profiles p ON p.id = o.user_id
      LEFT JOIN public.customers c ON c.id = o.customer_id AND c.user_id = o.user_id
      WHERE o.created_at >= v_start AND o.created_at <= now()
        AND (coalesce(p_status, '') = '' OR o.status = p_status)
        AND (v_query = '' OR strpos(lower(concat_ws(' ', o.reference, o.id::text, p.company_name, p.email, c.name, c.email)), v_query) > 0)
    ), page AS (SELECT * FROM filtered ORDER BY created_at DESC, id LIMIT 20 OFFSET v_offset)
    SELECT jsonb_build_object('total', (SELECT count(*) FROM filtered),
      'rows', coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC, id) FROM page), '[]'::jsonb)) INTO v_result;
  ELSIF p_kind = 'integrations' THEN
    WITH filtered AS MATERIALIZED (
      SELECT i.id, i.user_id, i.provider, i.environment, i.status,
             i.enabled_payment_methods, i.last_tested_at, i.last_test_status, i.created_at,
             coalesce(nullif(p.company_name, ''), p.full_name, 'Loja removida') AS merchant
      FROM public.payment_integrations i LEFT JOIN public.profiles p ON p.id = i.user_id
      WHERE (coalesce(p_status, '') = '' OR i.status = p_status)
        AND (v_query = '' OR strpos(lower(concat_ws(' ', i.provider, p.company_name, p.email)), v_query) > 0)
    ), page AS (SELECT * FROM filtered ORDER BY created_at DESC, id LIMIT 20 OFFSET v_offset)
    SELECT jsonb_build_object('total', (SELECT count(*) FROM filtered),
      'rows', coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC, id) FROM page), '[]'::jsonb)) INTO v_result;
  ELSIF p_kind = 'events' THEN
    WITH combined AS (
      SELECT w.id, w.created_at, 'webhook'::text AS source, w.provider,
             w.event_type AS action, w.status, w.result, w.order_id,
             coalesce(nullif(p.company_name, ''), p.full_name, 'Loja removida') AS merchant,
             NULL::text AS actor
      FROM public.webhook_events w LEFT JOIN public.profiles p ON p.id = w.user_id
      UNION ALL
      SELECT a.id, a.created_at, 'admin', NULL, a.action, 'recorded', NULL, NULL,
             coalesce(nullif(p.company_name, ''), p.full_name, 'Loja removida'), actor.full_name
      FROM private.platform_admin_audit a LEFT JOIN public.profiles p ON p.id = a.merchant_id
      LEFT JOIN public.profiles actor ON actor.id = a.actor_id
    ), filtered AS MATERIALIZED (
      SELECT * FROM combined WHERE created_at >= v_start AND created_at <= now()
        AND (coalesce(p_status, '') = '' OR status = p_status)
        AND (v_query = '' OR strpos(lower(concat_ws(' ', merchant, action, provider, actor, order_id::text)), v_query) > 0)
    ), page AS (SELECT * FROM filtered ORDER BY created_at DESC, id LIMIT 20 OFFSET v_offset)
    SELECT jsonb_build_object('total', (SELECT count(*) FROM filtered),
      'rows', coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC, id) FROM page), '[]'::jsonb)) INTO v_result;
  ELSE RAISE EXCEPTION 'invalid_resource';
  END IF;
  RETURN v_result || jsonb_build_object('page', p_page, 'page_size', 20);
END;
$$;

CREATE FUNCTION public.pavox_admin_merchant(p_merchant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb;
BEGIN
  PERFORM private.require_platform_admin();
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_merchant_id) THEN RAISE EXCEPTION 'merchant_not_found'; END IF;
  SELECT jsonb_build_object(
    'orders', (SELECT count(*) FROM public.orders WHERE user_id = p_merchant_id),
    'volume', (SELECT coalesce(sum(amount), 0) FROM public.orders WHERE user_id = p_merchant_id AND status = 'Aprovado'),
    'checkouts', (SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) FROM (
      SELECT id, name, slug, published FROM public.checkouts WHERE user_id = p_merchant_id ORDER BY created_at DESC LIMIT 20
    ) c),
    'notes', (SELECT coalesce(jsonb_agg(to_jsonb(n)), '[]'::jsonb) FROM (
      SELECT n.id, n.body, n.created_at, p.full_name AS actor FROM private.platform_admin_notes n
      LEFT JOIN public.profiles p ON p.id = n.actor_id
      WHERE n.merchant_id = p_merchant_id ORDER BY n.created_at DESC, n.id LIMIT 50
    ) n)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

CREATE FUNCTION public.pavox_admin_add_note(p_merchant_id uuid, p_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_actor uuid; v_id uuid;
BEGIN
  v_actor := private.require_platform_admin(true);
  IF p_body IS NULL OR length(btrim(p_body)) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION 'invalid_note'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_merchant_id) THEN RAISE EXCEPTION 'merchant_not_found'; END IF;
  INSERT INTO private.platform_admin_notes (merchant_id, actor_id, body)
  VALUES (p_merchant_id, v_actor, btrim(p_body)) RETURNING id INTO v_id;
  INSERT INTO private.platform_admin_audit (actor_id, merchant_id, action)
  VALUES (v_actor, p_merchant_id, 'merchant_note_added');
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pavox_admin_access() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pavox_admin_overview(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pavox_admin_list(text, text, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pavox_admin_merchant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pavox_admin_add_note(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pavox_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_admin_overview(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_admin_list(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_admin_merchant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_admin_add_note(uuid, text) TO authenticated;

COMMIT;

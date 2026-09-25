-- 0012_custom_domains.sql
--
-- Domínios próprios dos lojistas (ex.: checkout.minhaloja.com.br).
-- O domínio é adicionado ao projeto da Vercel pela Edge Function `domains`
-- (API da Vercel), que também confere o DNS; a Vercel emite o HTTPS.
-- O site resolve o host da requisição com get_domain_checkout().

CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  checkout_id UUID REFERENCES public.checkouts(id) ON DELETE SET NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending_dns',
  dns_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_error TEXT,
  last_checked_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT domains_hostname_key UNIQUE (hostname),
  CONSTRAINT domains_status_check CHECK (status IN ('pending_dns', 'verifying', 'active', 'error')),
  CONSTRAINT domains_hostname_format CHECK (
    length(hostname) <= 253
    AND hostname ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
  )
);

CREATE INDEX IF NOT EXISTS domains_user_idx ON public.domains (user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS domains_one_primary_per_user ON public.domains (user_id) WHERE is_primary;

DROP TRIGGER IF EXISTS domains_touch_updated_at ON public.domains;
CREATE TRIGGER domains_touch_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own domains read" ON public.domains;
CREATE POLICY "own domains read" ON public.domains FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.domains FROM anon, authenticated;
GRANT SELECT ON public.domains TO authenticated;
GRANT ALL ON public.domains TO service_role;

-- Limite de domínios por plano (Free 1, Growth 3, Pro 5).
CREATE OR REPLACE FUNCTION public.pavox_domain_limit(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT CASE coalesce(
    (SELECT pl.slug FROM public.subscriptions s JOIN public.plans pl ON pl.id = s.plan_id
      WHERE s.user_id = p_user_id AND s.status = 'active'), 'free')
    WHEN 'pro' THEN 5
    WHEN 'growth' THEN 3
    ELSE 1
  END
$$;

CREATE OR REPLACE FUNCTION public.pavox_domain_public_json(d public.domains)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT to_jsonb(d)
$$;

-- ---------------------------------------------------------------------------
-- Ações do lojista (checam o dono pela sessão)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_domain_checkout(p_domain_id uuid, p_checkout_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_row public.domains;
BEGIN
  IF p_checkout_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.checkouts WHERE id = p_checkout_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'checkout_not_found';
  END IF;
  UPDATE public.domains SET checkout_id = p_checkout_id
   WHERE id = p_domain_id AND user_id = auth.uid()
  RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'domain_not_found'; END IF;
  RETURN public.pavox_domain_public_json(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_primary_domain(p_domain_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_row public.domains;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.domains WHERE id = p_domain_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'domain_not_found';
  END IF;
  UPDATE public.domains SET is_primary = false WHERE user_id = auth.uid() AND is_primary AND id <> p_domain_id;
  UPDATE public.domains SET is_primary = true WHERE id = p_domain_id RETURNING * INTO v_row;
  RETURN public.pavox_domain_public_json(v_row);
END;
$$;

REVOKE ALL ON FUNCTION public.set_domain_checkout(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_primary_domain(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_domain_checkout(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_primary_domain(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Backend (service_role): cadastro e status vindos da Vercel
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pavox_add_domain(p_user_id uuid, p_hostname text, p_checkout_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.domains;
  v_count integer;
BEGIN
  -- Serializa inclusões do mesmo lojista para o limite valer sob concorrência.
  PERFORM pg_advisory_xact_lock(hashtext('pavox_domains_' || p_user_id::text));

  IF EXISTS (SELECT 1 FROM public.domains WHERE hostname = p_hostname) THEN
    RAISE EXCEPTION 'domain_taken';
  END IF;
  SELECT count(*) INTO v_count FROM public.domains WHERE user_id = p_user_id;
  IF v_count >= public.pavox_domain_limit(p_user_id) THEN
    RAISE EXCEPTION 'domain_limit_reached';
  END IF;
  IF p_checkout_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.checkouts WHERE id = p_checkout_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'checkout_not_found';
  END IF;

  INSERT INTO public.domains (user_id, hostname, checkout_id, is_primary)
  VALUES (p_user_id, p_hostname, p_checkout_id, v_count = 0)
  RETURNING * INTO v_row;
  RETURN public.pavox_domain_public_json(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.pavox_update_domain_status(
  p_domain_id uuid,
  p_status text,
  p_dns_records jsonb,
  p_error text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_row public.domains;
BEGIN
  UPDATE public.domains
     SET status = p_status,
         dns_records = coalesce(p_dns_records, dns_records),
         last_error = p_error,
         last_checked_at = now(),
         verified_at = CASE WHEN p_status = 'active' THEN coalesce(verified_at, now()) ELSE NULL END
   WHERE id = p_domain_id
  RETURNING * INTO v_row;
  RETURN CASE WHEN v_row.id IS NULL THEN NULL ELSE public.pavox_domain_public_json(v_row) END;
END;
$$;

CREATE OR REPLACE FUNCTION public.pavox_remove_domain(p_user_id uuid, p_domain_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_host text; v_was_primary boolean;
BEGIN
  DELETE FROM public.domains WHERE id = p_domain_id AND user_id = p_user_id
  RETURNING hostname, is_primary INTO v_host, v_was_primary;
  IF v_host IS NULL THEN RAISE EXCEPTION 'domain_not_found'; END IF;
  IF v_was_primary THEN
    UPDATE public.domains SET is_primary = true
     WHERE id = (SELECT id FROM public.domains WHERE user_id = p_user_id ORDER BY created_at LIMIT 1);
  END IF;
  RETURN v_host;
END;
$$;

REVOKE ALL ON FUNCTION public.pavox_add_domain(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_update_domain_status(uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pavox_remove_domain(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pavox_add_domain(uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_update_domain_status(uuid, text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pavox_remove_domain(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Público: qual checkout abrir para um host
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_domain_checkout(p_host text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object('store', p.store_slug, 'checkout', c.slug)
  FROM public.domains d
  JOIN public.profiles p ON p.id = d.user_id
  JOIN public.checkouts c ON c.id = d.checkout_id AND c.published
  WHERE d.hostname = lower(p_host) AND d.status = 'active'
$$;
REVOKE ALL ON FUNCTION public.get_domain_checkout(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_domain_checkout(text) TO anon, authenticated;

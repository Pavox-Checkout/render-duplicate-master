ALTER TABLE public.checkouts
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.enforce_checkout_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER := 3;
BEGIN
  SELECT COALESCE(p.checkout_limit, 3) INTO max_allowed
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = NEW.user_id;

  IF max_allowed IS NULL THEN
    max_allowed := 3;
  END IF;

  SELECT count(*) INTO current_count FROM public.checkouts WHERE user_id = NEW.user_id;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'checkout_limit_reached'
      USING HINT = 'Você atingiu o limite de checkouts do seu plano.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS checkouts_limit_guard ON public.checkouts;
CREATE TRIGGER checkouts_limit_guard
  BEFORE INSERT ON public.checkouts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_checkout_limit();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS checkouts_touch_updated_at ON public.checkouts;
CREATE TRIGGER checkouts_touch_updated_at
  BEFORE UPDATE ON public.checkouts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

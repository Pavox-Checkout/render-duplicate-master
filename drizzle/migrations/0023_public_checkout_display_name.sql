-- Expose the merchant's configured checkout display name to public checkouts.
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
  v_checkout_display_name text;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE store_slug = lower(p_store_slug);
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_checkout FROM public.checkouts
  WHERE user_id = v_profile.id AND slug = lower(p_checkout_slug) AND published;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT NULLIF(trim(raw_user_meta_data->>'checkout_name'), '')
    INTO v_checkout_display_name
    FROM auth.users
   WHERE id = v_profile.id;

  v_product_id := public.pavox_checkout_product_id(v_checkout);
  IF v_product_id IS NOT NULL THEN
    SELECT * INTO v_product FROM public.products WHERE id = v_product_id AND status = 'Ativo';
  END IF;
  v_price := CASE WHEN v_product.id IS NULL THEN NULL ELSE public.pavox_product_charge_price(v_product) END;

  RETURN jsonb_build_object(
    'checkout', jsonb_build_object('id', v_checkout.id, 'name', v_checkout.name, 'slug', v_checkout.slug, 'config', v_checkout.config),
    'store', jsonb_build_object('slug', v_profile.store_slug, 'name', v_profile.company_name, 'checkout_display_name', v_checkout_display_name),
    'product', CASE WHEN v_product.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_product.id, 'name', v_product.name, 'description', v_product.description,
      'type', v_product.type, 'price', v_price,
      'compare_at', CASE WHEN v_price < v_product.price THEN v_product.price ELSE NULL END,
      'image', nullif(v_product.main_image, ''),
      'available', NOT (v_product.track_inventory AND NOT v_product.allow_backorder AND v_product.inventory_quantity < 1)
    ) END,
    'payment_methods', to_jsonb(public.pavox_checkout_payment_methods(v_checkout)),
    'document_required', to_jsonb(public.pavox_document_required_methods(v_checkout)),
    'phone_required', to_jsonb(public.pavox_phone_required_methods(v_checkout))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_checkout(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_checkout(text, text) TO anon, authenticated;

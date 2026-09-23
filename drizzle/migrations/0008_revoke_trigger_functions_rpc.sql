-- Trigger-only SECURITY DEFINER functions must not be callable via /rest/v1/rpc
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_checkout_limit() FROM PUBLIC, anon, authenticated;

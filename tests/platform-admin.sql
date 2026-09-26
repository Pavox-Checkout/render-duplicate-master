-- Run only against an isolated, migrated test database as its owner.
-- Fixtures are rolled back. This exercises the actual RPCs under API roles.
BEGIN;

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
('10000000-0000-4000-8000-000000000001', 'admin@example.test', '{"full_name":"Admin QA"}'),
('10000000-0000-4000-8000-000000000002', 'viewer@example.test', '{"full_name":"Viewer QA"}'),
('10000000-0000-4000-8000-000000000003', 'merchant-a@example.test', '{"full_name":"Loja Alfa"}'),
('10000000-0000-4000-8000-000000000004', 'merchant-b@example.test', '{"full_name":"Loja Beta"}');
INSERT INTO private.platform_admins (user_id, role) VALUES
('10000000-0000-4000-8000-000000000001', 'admin'),
('10000000-0000-4000-8000-000000000002', 'viewer');
INSERT INTO auth.users (id, email, raw_user_meta_data)
SELECT ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'pagination-' || n || '@example.test', jsonb_build_object('full_name', 'Pagination ' || n)
FROM generate_series(1, 23) n;

INSERT INTO public.orders (id, user_id, reference, amount, platform_fee, status, paid_at, created_at, buyer)
VALUES
('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'QA-A', 100, 1.99, 'Aprovado', now(), now(), '{"document":"SECRET_DOCUMENT"}'),
('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', 'QA-B', 50, 0.99, 'Aprovado', now(), now(), '{}'),
('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'QA-PENDING', 75, 0, 'Pendente', NULL, now(), '{}'),
('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 'QA-REFUND', 999, 19.88, 'Reembolsado', now(), now(), '{}'),
('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', 'QA-OLD', 123, 2.44, 'Aprovado', now() - interval '100 days', now() - interval '100 days', '{}'),
('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', 'QA-FUTURE', 456, 9.07, 'Aprovado', now() + interval '1 day', now() + interval '1 day', '{}');
INSERT INTO public.payment_integrations (user_id, provider, status, credentials, credentials_masked)
VALUES ('10000000-0000-4000-8000-000000000003', 'mercadopago', 'error', '{"token":"SECRET_GATEWAY"}', '{"token":"MASKED_SECRET"}');
INSERT INTO public.webhook_events (provider, event_id, event_type, user_id, order_id, status, payload)
VALUES ('mercadopago', 'QA-EVENT', 'payment.updated', '10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'rejected', '{"raw":"SECRET_WEBHOOK"}');

SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.pavox_admin_access(); RAISE EXCEPTION 'Anonymous access allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.pavox_admin_overview(); RAISE EXCEPTION 'Anonymous overview allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.pavox_admin_list('merchants'); RAISE EXCEPTION 'Anonymous list allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.pavox_admin_merchant('10000000-0000-4000-8000-000000000003'); RAISE EXCEPTION 'Anonymous detail allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.pavox_admin_add_note('10000000-0000-4000-8000-000000000003','no access'); RAISE EXCEPTION 'Anonymous write allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
DO $$ DECLARE kind text; BEGIN
  ASSERT public.pavox_admin_access()->>'role' IS NULL, 'Merchant was promoted';
  BEGIN PERFORM public.pavox_admin_overview(); RAISE EXCEPTION 'Merchant overview allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  FOREACH kind IN ARRAY ARRAY['merchants','subscriptions','transactions','integrations','events'] LOOP
    BEGIN PERFORM public.pavox_admin_list(kind); RAISE EXCEPTION 'Merchant list allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  END LOOP;
  BEGIN PERFORM public.pavox_admin_merchant('10000000-0000-4000-8000-000000000004'); RAISE EXCEPTION 'Merchant detail allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.pavox_admin_add_note('10000000-0000-4000-8000-000000000004','no access'); RAISE EXCEPTION 'Merchant write allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO private.platform_admins(user_id,role) VALUES(auth.uid(),'admin'); RAISE EXCEPTION 'Self promotion allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  ASSERT (SELECT count(*) FROM public.orders WHERE user_id = '10000000-0000-4000-8000-000000000004') = 0, 'Tenant isolation lost';
  ASSERT (SELECT count(*) FROM public.orders) = 5, 'Own order visibility changed';
END $$;

SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  ASSERT public.pavox_admin_access()->>'role' = 'viewer';
  ASSERT public.pavox_admin_overview()->>'volume' = '150.00';
  ASSERT (public.pavox_admin_merchant('10000000-0000-4000-8000-000000000003')->>'orders')::int = 5;
  BEGIN PERFORM public.pavox_admin_add_note('10000000-0000-4000-8000-000000000003','not allowed'); RAISE EXCEPTION 'Viewer write allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
DO $$ DECLARE v jsonb; first_page jsonb; second_page jsonb; n uuid; kind text; BEGIN
  ASSERT public.pavox_admin_access()->>'role' = 'admin';
  v := public.pavox_admin_overview(30);
  ASSERT (v->>'volume')::numeric = 150, 'GMV must exclude pending, refunded, historical and future payments';
  ASSERT (v->>'fees')::numeric = 2.98, 'Fees must use actual approved amounts';
  ASSERT (v->>'orders')::integer = 4;
  ASSERT (v->>'pending_orders')::integer = 1;
  ASSERT (v->>'integration_errors')::integer = 1;
  ASSERT (v->>'webhook_rejections')::integer = 1;
  ASSERT jsonb_array_length(v->'series') = 30;
  ASSERT (SELECT sum((x->>'amount')::numeric) FROM jsonb_array_elements(v->'series') x) = 150;
  ASSERT jsonb_array_length(public.pavox_admin_overview(7)->'series') = 7;
  ASSERT jsonb_array_length(public.pavox_admin_overview(90)->'series') = 90;
  first_page := public.pavox_admin_list('merchants', 'pagination-', '', 1);
  second_page := public.pavox_admin_list('merchants', 'pagination-', '', 2);
  ASSERT (first_page->>'total')::int = 23;
  ASSERT jsonb_array_length(first_page->'rows') = 20;
  ASSERT jsonb_array_length(second_page->'rows') = 3;
  ASSERT NOT EXISTS (SELECT 1 FROM jsonb_array_elements(first_page->'rows') a, jsonb_array_elements(second_page->'rows') b WHERE a->>'id' = b->>'id'), 'Pagination overlap';
  ASSERT (public.pavox_admin_list('merchants','%')->>'total')::int = 0, 'Search must be literal';
  ASSERT (public.pavox_admin_list('transactions','','Pendente')->>'total')::int = 1;
  ASSERT (public.pavox_admin_list('transactions','qa-a')->>'total')::int = 1;
  ASSERT (public.pavox_admin_list('subscriptions','','none')->>'total')::int = 27;
  FOREACH kind IN ARRAY ARRAY['transactions','integrations','events'] LOOP
    v := public.pavox_admin_list(kind);
    ASSERT v::text NOT LIKE '%SECRET%', 'Sensitive fields exposed';
    ASSERT v::text NOT LIKE '%credentials%', 'Credential keys exposed';
    ASSERT v::text NOT LIKE '%payload%', 'Webhook payload exposed';
    ASSERT v::text NOT LIKE '%buyer%', 'Buyer document exposed';
  END LOOP;
  BEGIN PERFORM public.pavox_admin_list('invalid'); RAISE EXCEPTION 'Expected invalid_resource'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM = 'invalid_resource'; END;
  BEGIN PERFORM public.pavox_admin_list('merchants', '', '', 0); RAISE EXCEPTION 'Expected invalid_page'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM = 'invalid_page'; END;
  BEGIN PERFORM public.pavox_admin_overview(365); RAISE EXCEPTION 'Expected invalid_period'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM = 'invalid_period'; END;
  BEGIN PERFORM public.pavox_admin_overview(NULL); RAISE EXCEPTION 'Expected invalid_period'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM = 'invalid_period'; END;
  BEGIN PERFORM public.pavox_admin_add_note('10000000-0000-4000-8000-000000000003','  '); RAISE EXCEPTION 'Expected invalid_note'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM = 'invalid_note'; END;
  BEGIN PERFORM public.pavox_admin_merchant('99999999-0000-4000-8000-000000000003'); RAISE EXCEPTION 'Expected missing merchant'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM = 'merchant_not_found'; END;
  n := public.pavox_admin_add_note('10000000-0000-4000-8000-000000000003','  Atendimento realizado  ');
  v := public.pavox_admin_merchant('10000000-0000-4000-8000-000000000003');
  ASSERT v->'notes'->0->>'body' = 'Atendimento realizado';
  ASSERT v->'notes'->0->>'actor' = 'Admin QA';
  ASSERT (v->'notes'->0->>'id')::uuid = n;
  ASSERT (public.pavox_admin_list('events','','recorded')->>'total')::int = 1, 'Audit not written';
  BEGIN UPDATE private.platform_admin_notes SET body = 'tampered' WHERE id = n; RAISE EXCEPTION 'Direct note update allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN DELETE FROM private.platform_admin_audit; RAISE EXCEPTION 'Audit deletion allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

RESET ROLE;
DELETE FROM private.platform_admins WHERE user_id = '10000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  ASSERT public.pavox_admin_access()->>'role' IS NULL;
  BEGIN PERFORM public.pavox_admin_overview(); RAISE EXCEPTION 'Revoked admin still allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;

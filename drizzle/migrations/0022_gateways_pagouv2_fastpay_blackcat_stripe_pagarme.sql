-- Mais gateways: Pagou (API v2), FastPay, Blackcat, Stripe e Pagar.me.
--
-- * pagouv2, stripe, pagarme: Pix e boleto.
-- * fastpay, blackcat: só Pix (a API deles não documenta boleto).
-- * Todos exigem CPF/CNPJ do comprador; Blackcat e Pagar.me também telefone.

CREATE OR REPLACE FUNCTION public.pavox_supported_payment_providers()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT '{mercadopago,asaas,beehive,axionpay,pagou,credwave,hopysplit,appmax,garu,pagouv2,fastpay,blackcat,stripe,pagarme}'::text[]
$$;

CREATE OR REPLACE FUNCTION public.pavox_provider_methods(p_provider text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_provider = 'mercadopago' THEN '{pix,card,boleto}'::text[]
    WHEN p_provider IN ('asaas','beehive','axionpay','pagou','credwave','hopysplit','appmax','garu',
                        'pagouv2','stripe','pagarme')
      THEN '{pix,boleto}'::text[]
    WHEN p_provider IN ('fastpay','blackcat') THEN '{pix}'::text[]
    ELSE '{}'::text[]
  END
$$;

CREATE OR REPLACE FUNCTION public.pavox_provider_requires_document(p_provider text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT coalesce(p_provider IN ('asaas','beehive','axionpay','pagou','credwave','hopysplit','appmax','garu',
                                 'pagouv2','fastpay','blackcat','stripe','pagarme'), false)
$$;

CREATE OR REPLACE FUNCTION public.pavox_provider_requires_phone(p_provider text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT coalesce(p_provider IN ('beehive','axionpay','pagou','credwave','hopysplit','garu','blackcat','pagarme'), false)
$$;

# PAVOX — Auditoria de prontidão para produção

Última atualização: 2026-09-25

## Stack

- **Frontend/SSR:** TanStack Start (React 19, Vite) + Tailwind, hospedado na Vercel (`pavox-checkout-zeta.vercel.app`), sincronizado com Lovable.
- **Backend:** Supabase (projeto `cipiezekcudcvivtdnpr`, sa-east-1) — Postgres com RLS, Auth (código OTP de 8 dígitos por e-mail via SMTP Brevo), Storage (`product-images`, privado).
- **Acesso a dados:** o navegador fala direto com o Postgres via `@supabase/supabase-js` + RLS. Não há API própria nem Edge Functions ainda. `client.server.ts` (service role) existe mas não é usado.
- **Migrations:** `drizzle/migrations/*.sql` (journal em `meta/_journal.json`), aplicadas no Supabase via MCP.
- **Tenant:** o usuário (`auth.uid()`) é a loja. Todas as tabelas têm `user_id`/`account_id` com RLS por dono.

## Fluxo milestone

```
CRIAR CHECKOUT → PUBLICAR → LINK PÚBLICO → CLIENTE COMPRA → PEDIDO → COBRANÇA NO GATEWAY
→ PAGAMENTO SANDBOX APROVADO → WEBHOOK → PEDIDO = PAGO → VENDA → DASHBOARD
```

Estado: 🟡 implementado de ponta a ponta para **Pix via Mercado Pago**; falta a validação com credenciais de teste reais (compra sandbox + webhook).

---

## 🔴 Crítica

### 1. Página pública de checkout
- Estado atual: ✅ real (Sprint 1) — `/c/{loja}/{checkout}`, `src/routes/c.$store.$checkout.tsx`
- Arquivos envolvidos: `src/lib/checkouts-data.ts` (`publishCheckout`), `src/components/pavox/builder/checkout-preview.tsx` (modo `published` só simula), `src/routes/_dash/checkouts.*`
- Problema: publicar só marca `published = true`. Não existe rota pública; o renderizador declara "Nenhum modo cria cliente, pedido, venda, pagamento".
- Dependências: slug único (#16), produto vinculado ao checkout, criação de pedido (#5).
- Solução: rota pública `/c/{storeSlug}/{checkoutSlug}`; leitura via função SQL `SECURITY DEFINER` que expõe só o necessário de checkouts publicados; renderizador com callback real de envio.
- Risco: expor dados de outros lojistas ou do produto além do necessário; preço vindo do navegador.
- Prioridade: 🔴 crítica

### 2. Integrações reais de gateway (Mercado Pago, Stripe, Asaas, Pagar.me)
- Estado atual: 🟡 parcial — Mercado Pago Pix real (Orders API, `supabase/functions/_shared/gateways/mercadopago.ts`); Stripe, Asaas e Pagar.me aparecem como "Em breve"; cartão e boleto pendentes
- Arquivos envolvidos: `src/lib/payments/catalog.ts`, `src/lib/payments/use-integrations.ts`, `src/components/pavox/integration-*.tsx`, tabela `payment_integrations`
- Problema: nenhuma chamada a API de gateway; nenhum Pix/cartão/boleto é criado.
- Dependências: backend server-side (Edge Functions), #6.
- Solução: abstração `PaymentGateway` com um adaptador por provider (Edge Function); Mercado Pago Pix primeiro.
- Risco: cobrança duplicada sem idempotência; valor divergente.
- Prioridade: 🔴 crítica

### 3. Botão "Testar integração"
- Estado atual: ✅ real — Edge Function `integrations` chama `GET /users/me` do Mercado Pago e mapeia 401/403/429/5xx
- Arquivos envolvidos: `use-integrations.ts` (`useTestIntegration`)
- Problema: só verifica se os campos estão preenchidos e grava `last_test_status = 'ok'`.
- Dependências: #2.
- Solução: Edge Function chama endpoint autenticado do gateway e mapeia 401/403/429/5xx.
- Risco: lojista acredita que a chave é válida.
- Prioridade: 🔴 crítica

### 4. Webhooks / confirmação de pagamento
- Estado atual: 🟡 implementado — `mercadopago-webhook` + consulta server-to-server enquanto o comprador aguarda; `webhook_events` com `UNIQUE(provider, event_id)`; transição condicional em `pavox_apply_payment_status()`. Falta validar com notificação real do Mercado Pago
- Arquivos envolvidos: —
- Problema: nada marca pedido como pago.
- Dependências: #2, #5.
- Solução: Edge Function por provider, validação de assinatura / consulta server-to-server, tabela `webhook_events` com `UNIQUE(provider, event_id)`, transição condicional de status.
- Risco: venda duplicada; pedido marcado pago sem pagamento.
- Prioridade: 🔴 crítica

### 5. Pedidos, clientes e vendas
- Estado atual: ✅ real — pedido e cliente criados no servidor com preço do banco; detalhe do pedido mostra gateway, ID da transação, taxa e comprador
- Arquivos envolvidos: `orders`, `customers`, `src/routes/_dash/pedidos.*`, `clientes.tsx`, `vendas.tsx`, `src/lib/pavox-data.ts`
- Problema: nenhum fluxo cria pedido/cliente; `customers` sem unicidade por loja; `orders` sem campos de gateway, `paid_at`, idempotência.
- Dependências: #1.
- Solução: função transacional que busca preço no banco, faz upsert do cliente por `(user_id, email)` e cria o pedido com chave de idempotência.
- Risco: preço manipulado; clientes duplicados.
- Prioridade: 🔴 crítica

## 🟠 Alta

### 6. Segurança das credenciais
- Estado atual: ✅ real — segredos no Supabase Vault (`credentials_secret_id`), coluna `credentials` sem permissão de leitura para `authenticated`, gravação só pela Edge Function
- Arquivos envolvidos: `payment_integrations.credentials` (JSONB em texto puro), `use-integrations.ts` (lê `credentials` no navegador para mesclar/testar)
- Problema: segredos em texto puro e legíveis pelo navegador do dono via RLS.
- Solução: gravar/ler credenciais apenas em Edge Function; criptografia (AES-256-GCM, chave em secret da função) ou Supabase Vault; revogar `SELECT` da coluna para `authenticated`.
- Prioridade: 🟠 alta (nenhum segredo novo deve voltar ao navegador a partir da Sprint 2)

### 7. Domínios personalizados
- Estado atual: 🟡 implementado, aguardando `VERCEL_TOKEN` — tabela `domains` (migration 0012), Edge Function `domains` (API de domínios da Vercel: adicionar ao projeto, desafio TXT, `GET /v6/domains/{d}/config`), `src/lib/domains.ts`, `src/routes/_dash/dominios.tsx`, rota `/` resolve o host (`src/lib/custom-domain.ts` + `get_domain_checkout`)
- Fluxo: lojista informa `checkout.loja.com.br` → backend adiciona ao projeto Vercel → mostra CNAME/A (+ TXT de posse quando exigido) → "Verificar" consulta a Vercel → `active` só quando posse e DNS estão ok; HTTPS emitido pela Vercel.
- Limite por plano no banco (`pavox_domain_limit`: Free 1, Growth 3, Pro 5).
- Pendente: secret `VERCEL_TOKEN` nas Edge Functions do Supabase; teste com domínio real; opção "Domínio PAVOX" (subdomínio próprio da PAVOX) removida até a PAVOX ter um domínio.
- Prioridade: 🟠 alta

### 8. Assinaturas Growth/Pro
- Estado atual: 🔴 fake — `src/lib/billing.ts` faz `upsert` direto em `subscriptions`
- Problema: trocar de plano não cobra; permissões derivadas de linha editável pelo próprio usuário (RLS `FOR ALL`).
- Solução: cobrança pela conta de gateway da PAVOX + webhook ativa assinatura; usuário não pode escrever `subscriptions`.
- Prioridade: 🟠 alta

### 9. Taxa da PAVOX por venda
- Estado atual: 🟡 parcial — decisão: **split no Mercado Pago com a taxa do plano**. Lojista conectado por "Conectar com Mercado Pago" (OAuth): a taxa (`pavox_platform_fee`) é fixada na cobrança e enviada como `marketplace_fee`; o pedido registra `fee_collection = 'split'`. Chaves coladas manualmente não permitem split: taxa registrada com `fee_collection = 'invoice'`, sem cobrança automática.
- Arquivos: `_shared/gateways/mercadopago-oauth.ts` (`splitFee`), `_shared/payments.ts`, migration `0013_mercadopago_oauth_split.sql`
- Pendente: validar o split com uma venda real de um lojista diferente da conta dona da aplicação PAVOX; cobrar (ou migrar para OAuth) os lojistas com chaves manuais; a conta dona da aplicação não paga taxa a si mesma.
- Prioridade: 🟠 alta

## 🟡 Média

### 10. Dashboard, Vendas e detalhe do pedido
- Estado atual: 🟡 parcial — importam `src/lib/mock.ts`
- Solução: métricas a partir de `orders` pagos, agrupadas em `America/Sao_Paulo`; zero quando vazio.

### 11. Cupons, order bump, upsell, brindes, provas sociais, A/B, automação
- Estado atual: 🔴 fake — `src/lib/marketing-data.ts` (listas vazias) + `toast.success` sem persistência
- Atenção: o modelo padrão do Builder traz depoimentos fictícios ("Mariana A.", "Rafael S.") que aparecem no checkout público se o lojista não os editar.

### 12. Pixels e tracking
- Estado atual: 🔴 fake — catálogo apenas (`marketing.pixels.tsx`, `marketing.tracking.tsx`)

### 13. Escassez, faixa de desconto, compra ao vivo, sugestões de pagamento
- Estado atual: 🔴 fake — `toast.success` sem persistência (ex.: `marketing.escassez.tsx:37`)
- Observação: o renderizador do checkout mostra "1% de desconto no Pix" fixo e fretes fixos (`SHIPPING`), sem regra no servidor.

### 14. Configurações da empresa e Conta
- Estado atual: 🔴 fake — `configuracoes.tsx:65,118,149`, `conta.tsx:72` (toast sem backend; "Gerar API Key" e "Webhook de teste" fictícios)

### 15. Recuperação de vendas
- Estado atual: ⚫ inexistente

### 16. Slug dos checkouts
- Estado atual: 🟡 parcial — `slugify(name)` sem unicidade; slug muda a cada renomeação (`saveCheckout`/`publishCheckout`)
- Solução: `/{storeSlug}/{checkoutSlug}` com `UNIQUE(user_id, slug)`; slug estável após publicação.

## 🟢 Baixa

### 17. Equipe
- Estado atual: 🟡 parcial — 3 erros de TypeScript em `equipe.tsx`; convite não envia e-mail.

### 18. E-mails
- Estado atual: ✅ real — cadastro com código OTP (8 dígitos) via SMTP Brevo. Pendente: domínio próprio com SPF/DKIM/DMARC.

---

## Sprint 1 — checkout público, slug, pedido, cliente (em andamento)

- Migration `0010_public_checkout_orders.sql`: `profiles.store_slug` (único), `UNIQUE(user_id, slug)` em checkouts com slug estável, clientes únicos por `(user_id, lower(email))`, colunas de pedido (idempotência, gateway, `paid_at`, snapshot), status restritos, pedidos/clientes/taxas somente leitura para o lojista, `get_public_checkout()` e `create_public_order()` (preço do banco).
- Edge Function `public-checkout` (cria cliente + pedido via service role).
- Rota `/c/{loja}/{checkout}`; renderizador com envio real; link público real no Builder e na lista (copiar, abrir, despublicar).
- Checkout público oculta o que não tem backend: cupom, parcelas, fretes fixos, "1% no Pix", compra ao vivo e contador de escassez.
- Dry-run da migration no banco (transação desfeita): validou slugs, idempotência, dedupe de cliente, validação de e-mail e permissões.
- Pendente: aplicar em produção (aguardando confirmação), deploy da Edge Function, teste E2E no navegador. Nenhum método de pagamento é oferecido até a Sprint 2 (lista de gateways suportados vazia).

## Sprints 2 e 3 — Mercado Pago Pix, webhook, confirmação

- Migration `0011_payments_mercadopago_pix.sql`: Vault para credenciais, guarda de status da integração, `pavox_supported_payment_providers() = {mercadopago}` (Pix), `payment_data` no pedido, `get_public_order()`, `webhook_events`, `pavox_apply_payment_status()` (idempotente, valida valor/moeda/lojista, baixa estoque, calcula taxa), helper de imagem pública movido para o schema `private`.
- Edge Functions: `public-checkout` (cria pedido + Pix, consulta status), `integrations` (salva/testa no gateway), `mercadopago-webhook`.
- Testes: `supabase/functions/_shared/gateways/mercadopago_test.ts` (4 testes, API simulada); dry-runs das migrations 0010 e 0011 no banco (desfeitos); chamadas reais às Edge Functions via `pg_net` (400/404/401/409 esperados); E2E da página pública no navegador com respostas simuladas.
- Pendente: compra sandbox real com credenciais de teste do lojista (gera o Order ID pedido pelo Mercado Pago), confirmação por webhook real, formato exato da resposta Orders validado em produção.

## Sprint 4 — Conectar com Mercado Pago (OAuth) e split

- Aplicação **PAVOX** no Mercado Pago (App ID 751778378668882), redirect `…/functions/v1/mercadopago-oauth`, webhook da aplicação sem `?store=` (tópico Order).
- Migration `0013_mercadopago_oauth_split.sql`: `payment_integrations.connection_type/external_account_id/token_expires_at`, tabela `integration_oauth_states` (hash do state, uso único, 10 min), `pavox_consume_oauth_state`, `pavox_update_integration_credentials`, `orders.fee_collection`, taxa fixada em `pavox_attach_payment` e mantida na aprovação quando é split.
- Edge Functions: `mercadopago-oauth` (início autenticado + retorno do Mercado Pago), renovação automática do token 30 dias antes de vencer (`loadConnection`), `marketplace_fee` no `POST /v1/orders`, webhook encontra o pedido pelo ID do Mercado Pago.
- Front: botão "Conectar com Mercado Pago" (chaves manuais como opção avançada), aviso do resultado em `/integracoes?mp=…`, "Gerenciar" mostra o tipo de conexão e a taxa.
- Testes: 14 testes Deno (OAuth, renovação, split, allowlist de retorno, `marketplace_fee`); dry-run da migration; `state` falso recusado e início sem login → 401 nas funções publicadas.
- Pendente: secret `MP_CLIENT_SECRET` (usuária cola no Supabase); fluxo OAuth completo no navegador; renovação para lojistas sem vendas por 5+ meses (hoje só renova ao vender/testar).

## Histórico

- 2026-09-23: backend migrado para Supabase próprio; tabelas de equipe, bucket de imagens e `payment_integrations` criados; página `/confirmar-email`.
- 2026-09-25: migration 0009 corrigida (`name[]` × `text[]`) e aplicada; auditoria inicial.

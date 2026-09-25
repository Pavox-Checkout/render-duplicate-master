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

Estado: ⚫ inexistente a partir de "LINK PÚBLICO".

---

## 🔴 Crítica

### 1. Página pública de checkout
- Estado atual: ⚫ inexistente
- Arquivos envolvidos: `src/lib/checkouts-data.ts` (`publishCheckout`), `src/components/pavox/builder/checkout-preview.tsx` (modo `published` só simula), `src/routes/_dash/checkouts.*`
- Problema: publicar só marca `published = true`. Não existe rota pública; o renderizador declara "Nenhum modo cria cliente, pedido, venda, pagamento".
- Dependências: slug único (#16), produto vinculado ao checkout, criação de pedido (#5).
- Solução: rota pública `/c/{storeSlug}/{checkoutSlug}`; leitura via função SQL `SECURITY DEFINER` que expõe só o necessário de checkouts publicados; renderizador com callback real de envio.
- Risco: expor dados de outros lojistas ou do produto além do necessário; preço vindo do navegador.
- Prioridade: 🔴 crítica

### 2. Integrações reais de gateway (Mercado Pago, Stripe, Asaas, Pagar.me)
- Estado atual: 🔴 fake — só persiste credenciais
- Arquivos envolvidos: `src/lib/payments/catalog.ts`, `src/lib/payments/use-integrations.ts`, `src/components/pavox/integration-*.tsx`, tabela `payment_integrations`
- Problema: nenhuma chamada a API de gateway; nenhum Pix/cartão/boleto é criado.
- Dependências: backend server-side (Edge Functions), #6.
- Solução: abstração `PaymentGateway` com um adaptador por provider (Edge Function); Mercado Pago Pix primeiro.
- Risco: cobrança duplicada sem idempotência; valor divergente.
- Prioridade: 🔴 crítica

### 3. Botão "Testar integração"
- Estado atual: 🔴 fake
- Arquivos envolvidos: `use-integrations.ts` (`useTestIntegration`)
- Problema: só verifica se os campos estão preenchidos e grava `last_test_status = 'ok'`.
- Dependências: #2.
- Solução: Edge Function chama endpoint autenticado do gateway e mapeia 401/403/429/5xx.
- Risco: lojista acredita que a chave é válida.
- Prioridade: 🔴 crítica

### 4. Webhooks / confirmação de pagamento
- Estado atual: ⚫ inexistente
- Arquivos envolvidos: —
- Problema: nada marca pedido como pago.
- Dependências: #2, #5.
- Solução: Edge Function por provider, validação de assinatura / consulta server-to-server, tabela `webhook_events` com `UNIQUE(provider, event_id)`, transição condicional de status.
- Risco: venda duplicada; pedido marcado pago sem pagamento.
- Prioridade: 🔴 crítica

### 5. Pedidos, clientes e vendas
- Estado atual: 🟡 parcial — tabelas e telas existem, nada cria registros
- Arquivos envolvidos: `orders`, `customers`, `src/routes/_dash/pedidos.*`, `clientes.tsx`, `vendas.tsx`, `src/lib/pavox-data.ts`
- Problema: nenhum fluxo cria pedido/cliente; `customers` sem unicidade por loja; `orders` sem campos de gateway, `paid_at`, idempotência.
- Dependências: #1.
- Solução: função transacional que busca preço no banco, faz upsert do cliente por `(user_id, email)` e cria o pedido com chave de idempotência.
- Risco: preço manipulado; clientes duplicados.
- Prioridade: 🔴 crítica

## 🟠 Alta

### 6. Segurança das credenciais
- Estado atual: 🔴 inseguro
- Arquivos envolvidos: `payment_integrations.credentials` (JSONB em texto puro), `use-integrations.ts` (lê `credentials` no navegador para mesclar/testar)
- Problema: segredos em texto puro e legíveis pelo navegador do dono via RLS.
- Solução: gravar/ler credenciais apenas em Edge Function; criptografia (AES-256-GCM, chave em secret da função) ou Supabase Vault; revogar `SELECT` da coluna para `authenticated`.
- Prioridade: 🟠 alta (nenhum segredo novo deve voltar ao navegador a partir da Sprint 2)

### 7. Domínios personalizados
- Estado atual: 🔴 fake — `src/lib/domains-demo.ts`, `src/routes/_dash/dominios.tsx`, `domain-add-dialog.tsx`
- Problema: nada persiste, nenhuma verificação DNS/SSL.
- Solução: tabela `domains` + API de domínios da Vercel (adicionar domínio ao projeto, verificar TXT/CNAME, SSL automático).
- Prioridade: 🟠 alta

### 8. Assinaturas Growth/Pro
- Estado atual: 🔴 fake — `src/lib/billing.ts` faz `upsert` direto em `subscriptions`
- Problema: trocar de plano não cobra; permissões derivadas de linha editável pelo próprio usuário (RLS `FOR ALL`).
- Solução: cobrança pela conta de gateway da PAVOX + webhook ativa assinatura; usuário não pode escrever `subscriptions`.
- Prioridade: 🟠 alta

### 9. Taxa da PAVOX por venda
- Estado atual: ⚫ inexistente — tabela `transaction_fees` existe, nunca é preenchida
- Problema: modelo de cobrança da taxa ainda não definido (fatura posterior × split).
- Solução: `calculatePlatformFee` central em basis points; registrar no pedido ao confirmar pagamento.
- Prioridade: 🟠 alta — **decisão de negócio pendente**

## 🟡 Média

### 10. Dashboard, Vendas e detalhe do pedido
- Estado atual: 🟡 parcial — importam `src/lib/mock.ts`
- Solução: métricas a partir de `orders` pagos, agrupadas em `America/Sao_Paulo`; zero quando vazio.

### 11. Cupons, order bump, upsell, brindes, provas sociais, A/B, automação
- Estado atual: 🔴 fake — `src/lib/marketing-data.ts` (listas vazias) + `toast.success` sem persistência

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

## Histórico

- 2026-09-23: backend migrado para Supabase próprio; tabelas de equipe, bucket de imagens e `payment_integrations` criados; página `/confirmar-email`.
- 2026-09-25: migration 0009 corrigida (`name[]` × `text[]`) e aplicada; auditoria inicial.

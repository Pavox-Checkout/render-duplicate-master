# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Lojista (primary).** Brazilian sellers of both digital products (courses, mentorships, infoprodutos) and physical products shipped to the buyer, with equal weight. They create checkouts, connect their own payment gateway, manage products, orders and customers, and follow sales in the dashboard. Many run paid traffic and need the checkout live fast.
- **Comprador.** The buyer who lands on a store's public checkout (`/c/$store/$checkout`), usually from an ad or a sales page, on a phone, and pays by Pix, boleto or card. They never see the PAVOX dashboard.
- **Admin PAVOX.** The internal team that oversees lojistas, subscriptions, transactions, integrations and activity (`/admin`).

## Product Purpose

PAVOX is a checkout SaaS: a lojista builds a high-converting checkout for a product, charges through the payment gateway of their choice, and tracks the operation in real time. Success is more completed payments per visitor and a checkout the lojista can put live quickly.

## Positioning

- **Bring-your-own gateway.** The lojista connects the gateway they already use and can switch or route per payment method. Today that includes Mercado Pago (including OAuth connect), Asaas, Stripe, Pagar.me, Pagou, FastPay, Blackcat, Appmax, Garu, and the HopySplit brands (Beehive, Axion Pay, CredWave). The checkout is not locked to one acquirer.
- **Price and fees.** PAVOX competes on a lower cost than Yampi, Kiwify, Hotmart or CartPanda. The actual plan prices and fee percentages live in the app's billing data. Future work must not state specific numbers or comparisons that are not in that data.
- **Speed.** A checkout is fast to set up for the lojista and fast to load and pay for the buyer.

## Operating Context

- The lojista works in the dashboard on desktop and phone: Dashboard, Vendas, Pedidos, Produtos, Checkouts, Clientes, Recuperação, Analytics, Integrações, Domínios, Equipe, Planos, Configurações, Conta, PAVOX AI.
- The Marketing area holds conversion tools: order bump, upsell, cupons, escassez, faixa de desconto, provas sociais, compra ao vivo, brindes, A/B testing, automação, recuperação, pixels, tracking, and sugestões de pagamento.
- The buyer mostly pays by Pix (QR code plus copia-e-cola), and also by boleto and card. They need CPF/CNPJ and sometimes a phone number and address, depending on the gateway.
- PAVOX sends the buyer receipt and refund e-mails in the store's name. Refunds are triggered from the order page.
- The project is built with Lovable (TanStack Start). Supabase is the backend (Edge Functions and Postgres). Production is hosted on Vercel. Commits on `main` sync back to the Lovable editor.

## Capabilities and Constraints

- Payment methods: Pix, boleto and card. Card is currently processed only through Mercado Pago.
- A PAVOX platform fee applies. It is retained by split when the gateway supports it (Mercado Pago OAuth, Asaas), and otherwise billed later.
- Language is Brazilian Portuguese only. Currency is BRL.
- The checkout must never show a payment state the gateway did not confirm. Order state changes only from server-side confirmation.
- A redesign must keep every existing route, feature and flow working.
- **Redesign scope:** the whole site, prototyped in this order: buyer checkout (its own "Comprovante" world in the lojista's color), then the lojista panel, the landing page (`/`), login/sign-up, and admin last. Conquistas PAVOX move out of the panel.

## Brand Commitments

The PAVOX name, logo and colors are binding. The user confirmed this while reviewing the prototypes, correcting the earlier "everything can change" answer. What the redesign may change is layout, typography and components, not the brand.

- **Logo:** a "P" whose counter holds a bright-blue play triangle, next to a wide geometric uppercase wordmark "PAVOX". Use the logo files. Never redraw or retype the wordmark.
- **Colors:** navy `#001848` (primary: logo, headings, dark surfaces) and bright blue `#0052F8` / `#0055FB` (accent: the play triangle, actions, links). New surfaces are built on these two colors.
- **Assets:** the files in `public/` (`pavox-logo.png`, `favicon.png`, `pavox-banner.png`, `pavox-auth-banner.png`) are still in use.
- **Buyer checkout:** it uses the lojista's own color. PAVOX blue is only the default.

The user asked that every redesign be prototyped in a separate file first and replace the live UI only after they approve it. The 2026 redesign was approved and applied (see DESIGN.md); the previous design is kept on the `design-antigo` branch.

## Evidence on Hand

- Real product surfaces exist in `src/routes` (dashboard, checkout, admin) and in the gateway catalog (`src/lib/payments/catalog.ts`), which includes official gateway logos.
- There are no testimonials, customer logos, case studies, metrics, press, or published pricing comparisons in the repository. Future work must not fabricate any of these.

## Product Principles

1. **The buyer's payment comes first.** Every checkout decision serves getting a real, confirmed payment with the least friction on a phone.
2. **The lojista owns the money path.** Their gateway, their account, their data. PAVOX makes connecting and switching simple and honest about what each gateway supports.
3. **Fast to live.** Setting up a product and checkout should take minutes, and pages should load and respond instantly.
4. **Never fake it.** No invented numbers, social proof or statuses. If something is not configured or not confirmed, the interface says so plainly.
5. **Serve digital and physical sellers equally.** Flows adapt to whether the product ships (address, shipping) without making either kind of seller feel secondary.

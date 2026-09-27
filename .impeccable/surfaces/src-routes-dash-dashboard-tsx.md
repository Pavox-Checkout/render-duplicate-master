---
version: 1
slug: "src-routes-dash-dashboard-tsx"
primary_target: "src/routes/_dash/dashboard.tsx"
related_targets: ["design/prototypes/painel-extrato.html","src/routes/_dash/pedidos.index.tsx","src/routes/_dash/pedidos.$id.tsx","src/routes/_dash/produtos.index.tsx","src/routes/_dash/integracoes.tsx","src/components/pavox/sidebar-nav.tsx"]
---

# Painel do lojista (PAVOX app shell)

Scope: the lojista dashboard. This is the first surface of the new PAVOX identity. The prototype covers Visão geral, Pedidos, Detalhe do pedido, Produtos, and Integrações in design/prototypes/painel-extrato.html. The live routes change only after the user approves. Visitor mode: Operate. The checkout keeps its own Comprovante world with the lojista's color. This world is PAVOX's own.

Audience and task: a Brazilian lojista (digital and physical products) who checks the panel on phone and desktop equally, all day. On open, they want three things: how much they sold today, what is pending (Pix and boleto awaiting payment), and the chart. Conquistas PAVOX move out of the panel.

Constraints: only real metrics. No invented conversion rate, and no status the gateway did not confirm. Every existing route and feature stays reachable. pt-BR and BRL throughout.

## Direction contract

THESIS: The panel is the lojista's bank statement, marked up the way people check a statement: Bic-blue pen for actions, a lime highlighter on today's figure. It refuses the four-KPI-cards, chart, recent-table SaaS dashboard.

OWN-WORLD: Statement-white ground and cool ink. One pen blue (#3a55d8) for actions, links, focus, and today's series. A lime highlighter (#dff36b) used on three things only: today's figure, the active nav item, and the pending count. Entries are hairline-ruled rows grouped under day headers with the day total. Credits read "+ 197,00" in ink, pending reads in muted italic "a receber", expired is struck through, refunds are "− 197,00" in red. Bricolage Grotesque for figures and headings, Hanken Grotesk for UI with tabular columns. No cards, no gradients, no glass.

STORY: The lojista sees today's total at a glance and how it compares with yesterday at the same hour. They see what is still pending, and can scroll the statement or drill into any entry to refund or resend.

FIRST VIEWPORT: Desktop has a left rail with the PAVOX wordmark and nav. The main area shows "Vendido hoje" as a large highlighted figure with the delta vs yesterday, and the pending block to its right. Below sit the cumulative today-vs-yesterday chart and the statement. Mobile shows the figure, the pending line, the chart, then the statement, with a bottom tab bar.

FORM: Extrato (bank statement plus highlighter). This was the user's pick over the rolled split-flap board (candidate 4 of 7). Seed key 4b6497d1, degraded roll with no challengers. Signature interaction: a new sale lands as a fresh statement line, and the highlighter redraws under the new total.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

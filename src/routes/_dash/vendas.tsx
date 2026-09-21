import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, Receipt, ShoppingCart, Wallet } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { PeriodFilter } from "@/components/pavox/period-filter";
import { StatCard } from "@/components/pavox/stat-card";
import { RevenueChart } from "@/components/pavox/revenue-chart";
import { StatusBadge } from "@/components/pavox/status-badge";
import { brl, orders, paymentMix, products } from "@/lib/mock";

export const Route = createFileRoute("/_dash/vendas")({
  component: Vendas,
  head: () => ({
    meta: [
      { title: "Vendas · PAVOX" },
      {
        name: "description",
        content: "Faturamento, volume de vendas e mix de pagamento da sua operação na PAVOX.",
      },
      { property: "og:title", content: "Vendas · PAVOX" },
      { property: "og:description", content: "Acompanhe o faturamento e o mix de pagamento." },
    ],
  }),
});

function Vendas() {
  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle="Resultado financeiro consolidado do seu checkout."
        actions={<PeriodFilter />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Faturamento" value="R$ 128.450,90" delta={18.4} hint="30 dias" icon={Wallet} />
        <StatCard label="Vendas aprovadas" value="1.284" delta={12.8} hint="30 dias" icon={ShoppingCart} />
        <StatCard label="Ticket médio" value="R$ 100,04" delta={4.6} hint="30 dias" icon={Receipt} />
        <StatCard label="Taxa de aprovação" value="92,7%" delta={1.9} hint="30 dias" icon={BadgePercent} />
      </div>

      <RevenueChart />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Mix de pagamento</h2>
          <p className="text-[13px] text-muted-foreground">Participação por método</p>
          <div className="mt-5 space-y-4">
            {paymentMix.map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-[13px] font-medium">
                  <span>{m.name}</span>
                  <span>{m.value}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="text-base font-semibold">Produtos mais vendidos</h2>
          <p className="text-[13px] text-muted-foreground">Receita nos últimos 30 dias</p>
          <div className="mt-4 divide-y divide-border">
            {[...products]
              .sort((a, b) => b.revenue - a.revenue)
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 text-[13.5px]">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-[12px] text-muted-foreground">{p.sales} vendas</p>
                  </div>
                  <span className="font-display font-semibold">{brl(p.revenue)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="p-5">
          <h2 className="text-base font-semibold">Últimas transações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-y border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Pedido</th>
                <th className="px-5 py-2.5 font-medium">Cliente</th>
                <th className="px-5 py-2.5 font-medium">Método</th>
                <th className="px-5 py-2.5 font-medium">Gateway</th>
                <th className="px-5 py-2.5 font-medium">Valor</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                  <td className="px-5 py-3 font-medium">#{o.id}</td>
                  <td className="px-5 py-3">{o.customer}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.method}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.gateway}</td>
                  <td className="px-5 py-3 font-semibold">{brl(o.amount)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

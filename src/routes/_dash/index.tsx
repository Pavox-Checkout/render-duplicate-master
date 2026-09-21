import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  Plus,
  Receipt,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { PeriodFilter } from "@/components/pavox/period-filter";
import { StatCard } from "@/components/pavox/stat-card";
import { RevenueChart } from "@/components/pavox/revenue-chart";
import { FunnelCard } from "@/components/pavox/funnel-card";
import { IntelligenceCard } from "@/components/pavox/intelligence-card";
import { StatusBadge } from "@/components/pavox/status-badge";
import { Button } from "@/components/ui/button";
import { brl, metrics, orders, user } from "@/lib/mock";

export const Route = createFileRoute("/_dash/")({
  component: Overview,
  head: () => ({
    meta: [
      { title: "PAVOX · Visão geral da operação" },
      {
        name: "description",
        content:
          "Acompanhe faturamento, pedidos e conversão do seu checkout em tempo real com a PAVOX.",
      },
      { property: "og:title", content: "PAVOX · Visão geral da operação" },
      {
        property: "og:description",
        content: "Seu checkout. Mais conversão. Mais vendas.",
      },
    ],
  }),
});

const icons = {
  revenue: Wallet,
  orders: ShoppingCart,
  ticket: Receipt,
  conversion: BadgePercent,
} as const;

function Overview() {
  return (
    <>
      <PageHeader
        title={`Bom dia, ${user.name.split(" ")[0]} 👋`}
        subtitle="Acompanhe o desempenho da sua operação em tempo real."
        actions={
          <>
            <PeriodFilter />
            <Button asChild>
              <Link to="/checkouts/novo">
                <Plus className="h-4 w-4" /> Criar checkout
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.value}
            delta={m.delta}
            hint={m.hint}
            icon={icons[m.icon]}
          />
        ))}
      </div>

      <IntelligenceCard />

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <RevenueChart />
        <FunnelCard />
      </div>

      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-base font-semibold">Vendas recentes</h2>
            <p className="text-[13px] text-muted-foreground">Últimos pedidos processados</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/pedidos">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-y border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Pedido</th>
                <th className="px-5 py-2.5 font-medium">Cliente</th>
                <th className="px-5 py-2.5 font-medium">Produto</th>
                <th className="px-5 py-2.5 font-medium">Valor</th>
                <th className="px-5 py-2.5 font-medium">Pagamento</th>
                <th className="px-5 py-2.5 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                  <td className="px-5 py-3">
                    <Link
                      to="/pedidos/$id"
                      params={{ id: o.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      #{o.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{o.customer}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.product}</td>
                  <td className="px-5 py-3 font-semibold">{brl(o.amount)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

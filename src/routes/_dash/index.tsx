import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  LineChart,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { PeriodFilter } from "@/components/pavox/period-filter";
import { StatCard } from "@/components/pavox/stat-card";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/mock";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, useProducts } from "@/lib/pavox-data";

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

function Overview() {
  const { profile, user } = useAuth();
  const { data: orders = [] } = useOrders();

  const firstName =
    (profile?.full_name || "").trim().split(" ")[0] || user?.email?.split("@")[0] || "por aqui";

  const approved = orders.filter((o) => o.status === "Aprovado");
  const revenue = approved.reduce((sum, o) => sum + Number(o.amount), 0);
  const ticket = approved.length ? revenue / approved.length : 0;

  return (
    <>
      <PageHeader
        title={`Bom dia, ${firstName} 👋`}
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
        <StatCard label="Faturamento" value={brl(revenue)} hint="30 dias" icon={Wallet} />
        <StatCard label="Pedidos" value={String(orders.length)} hint="30 dias" icon={ShoppingCart} />
        <StatCard label="Ticket médio" value={brl(ticket)} hint="30 dias" icon={Receipt} />
        <StatCard label="Taxa de conversão" value="0,00%" hint="30 dias" icon={BadgePercent} />
      </div>

      <div className="surface p-5">
        <h2 className="text-base font-semibold">Faturamento</h2>
        <p className="text-[13px] text-muted-foreground">Últimos 30 dias</p>
        <EmptyState
          className="mt-5 border-0 bg-secondary/40"
          icon={LineChart}
          title="Seus dados aparecerão aqui"
          description="Comece criando seu primeiro produto e checkout."
          action={
            <Button asChild>
              <Link to="/produtos">
                <Package className="h-4 w-4" /> Criar primeiro produto
              </Link>
            </Button>
          }
        />
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
        {orders.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={Receipt}
              title="Nenhum pedido ainda."
              description="Quando seus clientes realizarem compras, seus pedidos aparecerão aqui."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-y border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Pedido</th>
                  <th className="px-5 py-2.5 font-medium">Valor</th>
                  <th className="px-5 py-2.5 font-medium">Pagamento</th>
                  <th className="px-5 py-2.5 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                    <td className="px-5 py-3 font-medium">#{o.reference || o.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 font-semibold">{brl(Number(o.amount))}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

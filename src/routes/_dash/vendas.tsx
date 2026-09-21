import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgePercent, LineChart, Package, Receipt, ShoppingCart, Wallet } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { PeriodFilter } from "@/components/pavox/period-filter";
import { StatCard } from "@/components/pavox/stat-card";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/mock";
import { useOrders } from "@/lib/pavox-data";

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
  const { data: orders = [] } = useOrders();
  const approved = orders.filter((o) => o.status === "Aprovado");
  const revenue = approved.reduce((sum, o) => sum + Number(o.amount), 0);
  const ticket = approved.length ? revenue / approved.length : 0;
  const approval = orders.length ? (approved.length / orders.length) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle="Resultado financeiro consolidado do seu checkout."
        actions={<PeriodFilter />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Faturamento" value={brl(revenue)} hint="30 dias" icon={Wallet} />
        <StatCard label="Vendas aprovadas" value={String(approved.length)} hint="30 dias" icon={ShoppingCart} />
        <StatCard label="Ticket médio" value={brl(ticket)} hint="30 dias" icon={Receipt} />
        <StatCard
          label="Taxa de aprovação"
          value={`${approval.toFixed(2).replace(".", ",")}%`}
          hint="30 dias"
          icon={BadgePercent}
        />
      </div>

      {orders.length === 0 ? (
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
      ) : (
        <div className="surface overflow-hidden">
          <div className="p-5">
            <h2 className="text-base font-semibold">Últimas transações</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-y border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Pedido</th>
                  <th className="px-5 py-2.5 font-medium">Método</th>
                  <th className="px-5 py-2.5 font-medium">Valor</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                    <td className="px-5 py-3 font-medium">#{o.reference || o.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{o.payment_method || "—"}</td>
                    <td className="px-5 py-3 font-semibold">{brl(Number(o.amount))}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

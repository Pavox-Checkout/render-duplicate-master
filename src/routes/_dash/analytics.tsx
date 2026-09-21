import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Plus } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { PeriodFilter } from "@/components/pavox/period-filter";
import { StatCard } from "@/components/pavox/stat-card";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { Eye, MousePointerClick, ShoppingCart, TrendingUp } from "lucide-react";
import { useOrders } from "@/lib/pavox-data";

export const Route = createFileRoute("/_dash/analytics")({
  component: Analytics,
  head: () => ({
    meta: [
      { title: "Analytics · PAVOX" },
      {
        name: "description",
        content: "Métricas de performance do checkout: visitas, conversão e origem do tráfego.",
      },
      { property: "og:title", content: "Analytics · PAVOX" },
      { property: "og:description", content: "Performance detalhada do seu checkout." },
    ],
  }),
});

function Analytics() {
  const { data: orders = [] } = useOrders();
  const hasData = orders.length > 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Entenda o comportamento de quem passa pelo seu checkout."
        actions={<PeriodFilter />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visitas ao checkout" value="0" hint="30 dias" icon={Eye} />
        <StatCard label="Checkouts iniciados" value="0" hint="30 dias" icon={MousePointerClick} />
        <StatCard label="Compras concluídas" value={String(orders.length)} hint="30 dias" icon={ShoppingCart} />
        <StatCard label="Taxa de conversão" value="0,00%" hint="30 dias" icon={TrendingUp} />
      </div>

      {!hasData && (
        <div className="surface p-5">
          <EmptyState
            className="border-0 bg-secondary/40"
            icon={BarChart3}
            title="Seus dados de performance aparecerão aqui."
            description="Publique seu primeiro checkout para começar a coletar dados."
            action={
              <Button asChild>
                <Link to="/checkouts/novo">
                  <Plus className="h-4 w-4" /> Criar checkout
                </Link>
              </Button>
            }
          />
        </div>
      )}
    </>
  );
}

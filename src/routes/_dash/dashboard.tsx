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
  Award,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { PeriodFilter } from "@/components/pavox/period-filter";
import { StatCard } from "@/components/pavox/stat-card";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/mock";
import { useOrders, useProducts } from "@/lib/pavox-data";
import { calculatePavoxAchievements, PAVOX_MILESTONES } from "@/lib/achievements";

export const Route = createFileRoute("/_dash/dashboard")({
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

function PavoxAchievements({ revenue, isError }: { revenue: number; isError: boolean }) {
  const progress = calculatePavoxAchievements(revenue);

  return (
    <section className="surface overflow-hidden border-primary/15 bg-gradient-to-br from-background via-background to-primary/[0.04] p-5 sm:p-6" aria-labelledby="conquistas-pavox-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></div>
            <div>
              <h2 id="conquistas-pavox-title" className="text-base font-semibold">Conquistas PAVOX</h2>
              <p className="text-[13px] text-muted-foreground">Transforme suas vendas em conquistas.</p>
            </div>
          </div>
          {isError ? (
            <p className="mt-5 text-sm text-muted-foreground">Não foi possível carregar seu faturamento acumulado.</p>
          ) : progress.isMaximumReached ? (
            <p className="mt-5 text-sm font-medium text-primary">Conquista máxima atual desbloqueada: Plaquinha PAVOX 1M.</p>
          ) : progress.revenue === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">Comece a vender para desbloquear suas conquistas PAVOX.</p>
          ) : progress.revenue < PAVOX_MILESTONES[0].amount ? (
            <p className="mt-5 text-sm text-muted-foreground">Faltam {brl(progress.remaining)} para conquistar sua primeira plaquinha PAVOX.</p>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Você já faturou {brl(progress.revenue)}. Continue avançando para sua próxima conquista.</p>
          )}
        </div>
        <div className="text-left lg:text-right">
          <p className="text-xs text-muted-foreground">Faturamento acumulado</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{isError ? "—" : brl(progress.revenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{progress.nextMilestone ? `Próximo objetivo: ${brl(progress.nextMilestone.amount)}` : "Marco máximo disponível"}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{isError ? "Progresso indisponível" : `${progress.percentage.toFixed(1).replace(".", ",")}% do próximo marco`}</span>
          {!isError && <span>{progress.nextMilestone ? `Faltam ${brl(progress.remaining)}` : "Concluído"}</span>}
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={isError ? 0 : progress.percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso das conquistas PAVOX">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400 transition-all" style={{ width: `${isError ? 0 : progress.percentage}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {PAVOX_MILESTONES.map((milestone) => {
            const achieved = !isError && progress.revenue >= milestone.amount;
            const next = !isError && progress.nextMilestone?.amount === milestone.amount;
            return (
              <div key={milestone.amount} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${achieved ? "border-primary/40 bg-primary/10 text-primary" : next ? "border-primary/50 bg-primary/5 text-foreground" : "border-border bg-secondary/30 text-muted-foreground"}`}>
                {achieved ? <Award className="h-4 w-4 shrink-0" /> : <LockKeyhole className="h-3.5 w-3.5 shrink-0" />}
                <div className="min-w-0"><p className="text-xs font-semibold">R$ {milestone.shortLabel}</p><p className="truncate text-[10px]">{achieved ? "Alcançado" : next ? milestone.reward : "Bloqueado"}</p></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Overview() {
  const { data: orders = [], isError: ordersError } = useOrders();
  const { data: products = [] } = useProducts();

  const approved = orders.filter((o) => o.status === "Aprovado");
  const revenue = approved.reduce((sum, o) => sum + Number(o.amount), 0);
  const ticket = approved.length ? revenue / approved.length : 0;

  return (
    <>
      <PageHeader
        title="Visão geral da sua operação"
        subtitle="Acompanhe vendas, conversão e desempenho dos seus checkouts."
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

      <PavoxAchievements revenue={revenue} isError={ordersError} />

      <div className="surface p-5">
        <h2 className="text-base font-semibold">Faturamento</h2>
        <p className="text-[13px] text-muted-foreground">Últimos 30 dias</p>
        {products.length === 0 ? (
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
        ) : (
          <EmptyState
            className="mt-5 border-0 bg-secondary/40"
            icon={LineChart}
            title="Vendas aparecerão aqui"
            description={`Você tem ${products.length} ${products.length === 1 ? "produto cadastrado" : "produtos cadastrados"}. Assim que houver vendas, este gráfico será preenchido.`}
          />
        )}
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

import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Lightbulb,
  Package,
  Radar,
  Receipt,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/pavox/stat-card";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { buildAiContext, usePavoxInsights, type PavoxInsight } from "@/lib/pavox-ai/insights";
import { ChatPanel } from "./chat-panel";
import { ContentGenerator } from "./content-generator";

const TONE_STYLES: Record<PavoxInsight["tone"], { dot: string; icon: typeof Lightbulb }> = {
  positive: { dot: "bg-success", icon: BadgeCheck },
  warning: { dot: "bg-destructive", icon: Radar },
  opportunity: { dot: "bg-primary", icon: Lightbulb },
  neutral: { dot: "bg-muted-foreground", icon: TrendingUp },
};

function InsightsList({ insights }: { insights: PavoxInsight[] }) {
  if (insights.length === 0) {
    return (
      <div className="surface flex flex-col items-center justify-center gap-2 p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Sparkles className="h-5 w-5" />
        </span>
        <p className="text-[14px] font-semibold">Tudo sob controle por aqui</p>
        <p className="max-w-sm text-[13px] text-muted-foreground">
          Assim que houver movimento na sua operação, a Pavox AI destacará oportunidades e alertas automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="surface divide-y divide-border overflow-hidden">
      {insights.map((insight) => {
        const tone = TONE_STYLES[insight.tone];
        return (
          <div key={insight.id} className="flex gap-3.5 p-5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <tone.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
                <p className="text-[14px] font-semibold">{insight.title}</p>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{insight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProDashboard({ greetingName }: { greetingName: string }) {
  const { isLoading, metrics, insights } = usePavoxInsights();
  const context = buildAiContext(metrics);

  return (
    <div className="space-y-6">
      <section className="surface grid-noise relative overflow-hidden p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-brand-gradient flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5.5 w-5.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">Pavox AI · Pro</p>
              <h1 className="text-2xl font-bold">Olá, {greetingName}</h1>
            </div>
          </div>
          <p className="max-w-sm text-[13.5px] text-muted-foreground">
            Inteligência aplicada aos dados reais da sua operação.
          </p>
        </div>
      </section>

      {!isLoading && !metrics.hasData ? (
        <div className="surface flex flex-col items-center justify-center gap-4 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="h-7 w-7" />
          </span>
          <div>
            <p className="text-lg font-semibold">Precisamos de dados para começar</p>
            <p className="mx-auto mt-1 max-w-md text-[13.5px] text-muted-foreground">
              Crie seu primeiro produto e checkout para que a Pavox AI possa analisar sua operação. O chat já está
              disponível para tirar dúvidas.
            </p>
          </div>
          <Button asChild>
            <Link to="/produtos">
              <Package className="h-4 w-4" />
              Criar primeiro produto
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Receita paga"
            value={brl(metrics.revenue)}
            hint={`${brl(metrics.revenue7d)} nos últimos 7 dias`}
            icon={CircleDollarSign}
          />
          <StatCard
            label="Conversão de pagamento"
            value={`${metrics.conversionRate.toFixed(1)}%`}
            hint={`${metrics.paidOrders} de ${metrics.totalOrders} pedidos`}
            icon={TrendingUp}
          />
          <StatCard
            label="Ticket médio"
            value={brl(metrics.aov)}
            hint={`${metrics.paidOrders} pedidos pagos`}
            icon={Receipt}
          />
          <StatCard
            label="Pedidos pendentes"
            value={String(metrics.pendingOrders)}
            hint="oportunidade de recuperação"
            icon={Radar}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <Lightbulb className="h-4.5 w-4.5 text-primary" />
              Oportunidades e recomendações
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-[12.5px]">
              <Link to="/recuperacao">
                Ver recuperação
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <InsightsList insights={insights} />
        </div>

        <ChatPanel context={context} />
      </div>

      <ContentGenerator context={context} />
    </div>
  );
}

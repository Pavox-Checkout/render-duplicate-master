import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap,
  DollarSign,
  Target,
  RotateCcw,
  Megaphone,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { StatCard } from "@/components/pavox/stat-card";
import { Button } from "@/components/ui/button";
import { MARKETING_ITEMS } from "@/lib/marketing-nav";
import { OVERVIEW_STATS } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/")({
  component: MarketingOverview,
  head: () => ({
    meta: [
      { title: "Marketing · PAVOX" },
      {
        name: "description",
        content:
          "Ferramentas de conversão, rastreamento e otimização do seu checkout na PAVOX.",
      },
    ],
  }),
});

const STAT_ICONS = [Zap, DollarSign, Target, RotateCcw, Megaphone];

function MarketingOverview() {
  const tools = MARKETING_ITEMS.filter((i) => i.to !== "/marketing");

  return (
    <>
      <PageHeader
        title="Marketing"
        subtitle="Aumente sua conversão com pixels, ofertas, provas sociais e automações — tudo integrado ao seu checkout."
        actions={
          <Button asChild size="sm">
            <Link to="/marketing/pixels">
              <Rocket className="h-4 w-4" /> Começar pelos pixels
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {OVERVIEW_STATS.map((s, i) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            hint={s.hint}
            icon={STAT_ICONS[i] ?? Zap}
          />
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Ferramentas</h2>
          <span className="text-[12px] text-muted-foreground">
            {tools.length} ferramentas disponíveis
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="surface group flex flex-col p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <tool.icon className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-3 flex items-center gap-1 text-[14px] font-semibold">
                {tool.label}
                <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Campanhas ativas</h2>
        <EmptyState
          icon={Megaphone}
          title="Você ainda não possui campanhas ativas"
          description="Configure uma ferramenta de marketing para começar a otimizar suas conversões. As campanhas ativas aparecerão aqui."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/marketing/cupons">Criar primeira campanha</Link>
            </Button>
          }
        />
      </section>
    </>
  );
}

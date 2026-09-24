import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Lock,
  MessagesSquare,
  PenLine,
  Radar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/mock";
import { PLAN_CATALOG } from "@/lib/billing";
import { DifferentialsDialog } from "./differentials-dialog";

const HIGHLIGHTS = [
  {
    icon: MessagesSquare,
    title: "Chat com os seus dados",
    description: "Pergunte qualquer coisa sobre a sua loja e receba respostas baseadas nos seus números reais.",
  },
  {
    icon: Radar,
    title: "Oportunidades automáticas",
    description: "A IA vasculha sua operação e mostra onde há receita parada esperando para ser destravada.",
  },
  {
    icon: PenLine,
    title: "Conteúdo que converte",
    description: "Descrições, títulos de checkout e mensagens de recuperação gerados sob medida para a sua loja.",
  },
] as const;

const proPlan = PLAN_CATALOG.find((p) => p.slug === "pro")!;

export function UpgradeExperience({ currentPlanName }: { currentPlanName: string | null }) {
  const [showDiff, setShowDiff] = useState(false);

  return (
    <>
      <section className="surface grid-noise relative overflow-hidden">
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
              <Lock className="h-3.5 w-3.5" />
              Exclusivo do plano Pro
            </span>
            <div className="space-y-3">
              <h1 className="text-gradient-brand text-3xl leading-tight font-bold sm:text-4xl">
                Desbloqueie a Pavox AI
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {currentPlanName
                  ? `Seu plano ${currentPlanName} não inclui a Pavox AI. `
                  : ""}
                Faça upgrade para o <strong className="text-foreground">Pro</strong> e transforme os dados da sua
                operação em recomendações, oportunidades e conteúdo que vendem mais.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="shadow-[var(--shadow-glow)]">
                <Link to="/planos">
                  Fazer upgrade para o Pro
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowDiff(true)}>
                Ver o que você desbloqueia
              </Button>
            </div>

            <p className="text-[12.5px] text-muted-foreground">
              A partir de <strong className="text-foreground">{brl(proPlan.monthlyPrice)}/mês</strong> · taxa por
              transação de apenas <strong className="text-foreground">{proPlan.feePercent.toFixed(2)}%</strong>
            </p>
          </div>

          {/* Teaser bloqueado do painel */}
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none select-none space-y-3 rounded-2xl border border-border bg-card/70 p-4 blur-[2px]"
            >
              <div className="flex items-center gap-2">
                <span className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
              <div className="space-y-2 rounded-xl border border-border p-3">
                <div className="h-2.5 w-3/4 rounded bg-muted" />
                <div className="h-2.5 w-1/2 rounded bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-border p-3">
                    <div className="h-2 w-1/2 rounded bg-muted" />
                    <div className="h-4 w-2/3 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/90 shadow-[var(--shadow-lift)]">
                <Lock className="h-6 w-6 text-primary" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="surface p-5">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <h.icon className="h-5 w-5" />
            </span>
            <h3 className="text-[15px] font-semibold">{h.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{h.description}</p>
          </div>
        ))}
      </div>

      <div className="surface p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
                Plano Pro
              </p>
              <p className="mt-1 font-display text-3xl font-bold">
                {brl(proPlan.monthlyPrice)}
                <span className="text-[15px] font-medium text-muted-foreground">/mês</span>
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {proPlan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13.5px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="shrink-0">
            <Button asChild size="lg" className="w-full lg:w-auto">
              <Link to="/planos">
                Assinar o Pro
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <DifferentialsDialog
        open={showDiff}
        onOpenChange={setShowDiff}
        footer={
          <Button asChild className="w-full">
            <Link to="/planos">
              Fazer upgrade para o Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
    </>
  );
}

import { Link } from "@tanstack/react-router";
import { Check, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_CATALOG, pct, type PlanDisplay } from "@/lib/billing";
import { Section, SectionHeading } from "../section-kit";
import { Reveal } from "../reveal";
import { cn } from "@/lib/utils";

function formatPrice(value: number) {
  if (value === 0) return "R$ 0";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Split the marketing feature list into included vs. not-included for display. */
function splitFeatures(features: string[]) {
  const included: string[] = [];
  const excluded: string[] = [];
  for (const f of features) {
    if (/^sem /i.test(f)) excluded.push(f.replace(/^sem /i, ""));
    else included.push(f);
  }
  return { included, excluded };
}

export function Pricing() {
  return (
    <Section id="planos">
      <SectionHeading
        align="center"
        eyebrow="Planos"
        title={<>Escolha o plano ideal para crescer.</>}
        description="Comece de graça e evolua conforme suas vendas aumentam. Sem surpresas."
      />

      <div className="mt-14 grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {PLAN_CATALOG.map((plan, i) => (
          <Reveal key={plan.slug} delay={i * 90}>
            <PlanCard plan={plan} />
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-center text-[13px] text-white/45">
        Taxa por transação a partir de {pct(PLAN_CATALOG[PLAN_CATALOG.length - 1].feePercent)} no plano Pro.
      </p>
    </Section>
  );
}

function PlanCard({ plan }: { plan: PlanDisplay }) {
  const { included, excluded } = splitFeatures(plan.features);
  const highlight = plan.highlight;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl border p-7 transition-colors",
        highlight
          ? "border-primary/50 bg-gradient-to-b from-primary/[0.12] to-white/[0.02] shadow-[0_30px_80px_-30px_oklch(0.55_0.23_262_/_0.6)]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20",
      )}
    >
      {highlight ? (
        <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg">
          <Sparkles className="h-3 w-3" /> Mais popular
        </span>
      ) : null}

      <div>
        <h3 className="font-display text-lg font-bold text-white">{plan.name}</h3>
        <p className="mt-1 text-[13px] text-white/50">{plan.checkoutLabel}</p>
      </div>

      <div className="mt-5 flex items-end gap-1.5">
        <span className="font-display text-4xl font-extrabold tracking-tight text-white">
          {formatPrice(plan.monthlyPrice)}
        </span>
        <span className="mb-1.5 text-[13px] text-white/45">/mês</span>
      </div>
      <p className="mt-1.5 text-[12.5px] text-primary">Taxa de {pct(plan.feePercent)} por transação</p>

      <Button
        asChild
        size="lg"
        variant={highlight ? "default" : "outline"}
        className={cn(
          "mt-6 h-12 w-full text-[14.5px]",
          highlight
            ? "shadow-[0_14px_36px_-12px_oklch(0.55_0.23_262_/_0.8)]"
            : "border-white/15 bg-white/[0.02] text-white hover:bg-white/5",
        )}
      >
        <Link to="/cadastro">{plan.monthlyPrice === 0 ? "Começar grátis" : `Assinar ${plan.name}`}</Link>
      </Button>

      <div className="mt-7 space-y-2.5 border-t border-white/10 pt-6">
        {included.map((f) => (
          <div key={f} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-[13px] leading-5 text-white/75">{f}</span>
          </div>
        ))}
        {excluded.map((f) => (
          <div key={f} className="flex items-start gap-2.5">
            <Minus className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
            <span className="text-[13px] leading-5 text-white/35 line-through decoration-white/20">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

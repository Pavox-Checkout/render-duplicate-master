import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { funnel, num } from "@/lib/mock";
import { Button } from "@/components/ui/button";

export function FunnelCard() {
  const top = funnel[0]!.value;
  return (
    <div className="surface flex flex-col p-5">
      <h2 className="text-base font-semibold">Funil de conversão</h2>
      <p className="text-[13px] text-muted-foreground">Da visita à compra aprovada</p>

      <div className="mt-5 space-y-3.5">
        {funnel.map((step, i) => {
          const pct = (step.value / top) * 100;
          const prev = i === 0 ? null : funnel[i - 1]!.value;
          const drop = prev ? ((prev - step.value) / prev) * 100 : 0;
          const worst = i === 3;
          return (
            <div key={step.label}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-medium">{step.label}</span>
                <span className="font-display font-semibold">{num(step.value)}</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-all"
                  style={{ width: `${pct}%`, opacity: 1 - i * 0.13 }}
                />
              </div>
              {prev && (
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {pct.toFixed(1)}% do topo ·{" "}
                  <span className={worst ? "font-semibold text-destructive" : ""}>
                    -{drop.toFixed(1)}% na etapa
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.55_0.14_75)]" />
        <p className="text-[12.5px] leading-relaxed">
          Seu maior ponto de perda está entre início do checkout e pagamento.
        </p>
      </div>

      <Button asChild variant="outline" className="mt-4 w-full">
        <Link to="/analytics">
          Ver análise <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

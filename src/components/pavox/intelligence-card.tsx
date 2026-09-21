import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntelligenceCard() {
  return (
    <div className="surface grid-noise relative overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="bg-brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
              Pavox Intelligence
            </p>
            <h3 className="text-[17px] font-semibold">Detectamos uma oportunidade</h3>
            <p className="max-w-xl text-[13.5px] text-muted-foreground">
              A taxa de abandono no pagamento aumentou 14% nas últimas 24 horas.
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/pavox-ai">
            Investigar <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

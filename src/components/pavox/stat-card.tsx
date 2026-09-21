import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  suffix = "%",
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  suffix?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="surface group relative overflow-hidden p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 font-display text-[26px] leading-none font-bold tracking-tight">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-[12px]">
        {delta !== undefined && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
            positive
              ? "bg-success/12 text-success"
              : "bg-destructive/12 text-destructive",
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {positive ? "+" : ""}
          {delta.toLocaleString("pt-BR")}
          {suffix}
        </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

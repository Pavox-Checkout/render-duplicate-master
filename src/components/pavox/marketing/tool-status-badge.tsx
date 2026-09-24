import { cn } from "@/lib/utils";
import type { MarketingToolStatus } from "@/lib/marketing-data";

const TONE: Record<MarketingToolStatus, string> = {
  Ativo: "bg-success/12 text-success border-success/20",
  Disponível: "bg-muted text-muted-foreground border-border",
  Configurando: "bg-warning/15 text-[oklch(0.52_0.13_75)] border-warning/25",
  Erro: "bg-destructive/12 text-destructive border-destructive/20",
  Pausado: "bg-muted text-muted-foreground border-border",
  Rascunho: "bg-accent text-accent-foreground border-primary/15",
};

export function ToolStatusBadge({
  status,
  className,
}: {
  status: MarketingToolStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
        TONE[status],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-current",
          status === "Configurando" && "animate-pulse",
        )}
      />
      {status}
    </span>
  );
}

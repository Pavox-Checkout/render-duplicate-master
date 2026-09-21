import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Aprovado: "bg-success/12 text-success border-success/20",
  Conectado: "bg-success/12 text-success border-success/20",
  Ativo: "bg-success/12 text-success border-success/20",
  Pendente: "bg-warning/15 text-[oklch(0.52_0.13_75)] border-warning/25",
  Convidado: "bg-warning/15 text-[oklch(0.52_0.13_75)] border-warning/25",
  Rascunho: "bg-muted text-muted-foreground border-border",
  Pausado: "bg-muted text-muted-foreground border-border",
  Disponível: "bg-muted text-muted-foreground border-border",
  Recusado: "bg-destructive/12 text-destructive border-destructive/20",
  Reembolsado: "bg-accent text-accent-foreground border-primary/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

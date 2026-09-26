import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminErrorMessage, count, label, type AdminDays } from "@/lib/admin/data";
import { cn } from "@/lib/utils";

export function AdminLoading() {
  return (
    <div
      role="status"
      className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
      Carregando dados…
    </div>
  );
}
export function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="surface flex flex-col items-start gap-3 p-6">
      <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
      <p className="text-sm">{adminErrorMessage(error)}</p>
      <Button variant="outline" onClick={retry}>
        <RefreshCw className="size-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
export function AdminEmpty({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-2 px-6 text-center">
      <Inbox className="mb-2 size-7 text-muted-foreground" aria-hidden="true" />
      <h3 className="text-sm font-semibold">
        {filtered ? "Nenhum resultado encontrado" : "Ainda não há registros"}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Tente outro termo ou limpe os filtros para ampliar a busca."
          : "Os registros da operação aparecerão aqui assim que estiverem disponíveis."}
      </p>
    </div>
  );
}
export function AdminStatus({ status }: { status: string }) {
  const good = ["active", "connected", "processed", "recorded", "Aprovado"].includes(status);
  const bad = ["error", "rejected", "past_due", "Recusado"].includes(status);
  const pending = ["pending", "Pendente", "received"].includes(status);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold",
        good
          ? "border-success/25 bg-success/10 text-foreground"
          : bad
            ? "border-destructive/30 bg-destructive/10 text-foreground"
            : pending
              ? "border-warning/30 bg-warning/10 text-foreground"
              : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          good
            ? "bg-success"
            : bad
              ? "bg-destructive"
              : pending
                ? "bg-warning"
                : "bg-muted-foreground",
        )}
      />
      {label(status)}
    </span>
  );
}
export function PeriodSelect({
  value,
  onChange,
}: {
  value: AdminDays;
  onChange: (value: AdminDays) => void;
}) {
  return (
    <select
      aria-label="Período"
      className="h-11 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as AdminDays)}
    >
      {[7, 30, 90].map((days) => (
        <option key={days} value={days}>
          Últimos {days} dias
        </option>
      ))}
    </select>
  );
}
export function AdminPagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
      <p className="text-xs text-muted-foreground" role="status">
        {count(total)} registros · Página {page} de {pages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="min-h-11"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

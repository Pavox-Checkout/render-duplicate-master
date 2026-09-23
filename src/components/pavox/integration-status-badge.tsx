import { cn } from "@/lib/utils";
import { STATUS_LABELS, type IntegrationStatus } from "@/lib/payments/catalog";

const styles: Record<IntegrationStatus, string> = {
  connected: "bg-success/12 text-success border-success/20",
  disabled: "bg-muted text-muted-foreground border-border",
  error: "bg-destructive/12 text-destructive border-destructive/20",
  not_connected: "bg-muted text-muted-foreground border-border",
};

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold",
        styles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}

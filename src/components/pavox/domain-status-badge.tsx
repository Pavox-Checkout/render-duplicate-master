import { cn } from "@/lib/utils";
import { DOMAIN_STATUS, type DomainStatus } from "@/lib/domains";

const toneClass: Record<string, string> = {
  success: "bg-success/12 text-success border-success/20",
  warning: "bg-warning/15 text-[oklch(0.52_0.13_75)] border-warning/25",
  neutral: "bg-muted text-muted-foreground border-border",
  error: "bg-destructive/12 text-destructive border-destructive/20",
};

export function DomainStatusBadge({ status }: { status: DomainStatus }) {
  const { label, tone, pulse } = DOMAIN_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold",
        toneClass[tone],
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full bg-current", pulse ? "animate-pulse" : "opacity-70")}
      />
      {label}
    </span>
  );
}

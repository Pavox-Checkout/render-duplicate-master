import { cn } from "@/lib/utils";

export function PavoxLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-brand-gradient relative flex h-8 w-8 items-center justify-center rounded-[10px] text-primary-foreground shadow-[var(--shadow-glow)]">
        <span className="font-display text-[15px] leading-none font-bold">X</span>
      </span>
      {!compact && (
        <span className="font-display text-[18px] leading-none font-bold tracking-[-0.03em]">
          PAVO
          <span className="text-primary">X</span>
        </span>
      )}
    </span>
  );
}

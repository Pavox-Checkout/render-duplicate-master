import { cn } from "@/lib/utils";

/** Official PAVOX wordmark: navy on light surfaces, white in the dark theme. */
export function PavoxLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const img = cn("h-7 w-auto object-contain object-left", compact && "w-7 object-cover");
  return (
    <span className={cn("flex h-8 items-center", className)}>
      <img
        src="/pavox-wordmark.png"
        alt="PAVOX"
        width={84}
        height={28}
        className={cn(img, "dark:hidden")}
      />
      <img
        src="/pavox-logo-white.png"
        alt="PAVOX"
        width={84}
        height={28}
        className={cn(img, "hidden dark:block")}
      />
    </span>
  );
}

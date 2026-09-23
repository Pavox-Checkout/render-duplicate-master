import { cn } from "@/lib/utils";
const dashboardLogoAsset = { url: "/pavox-logo.png" };

export function PavoxLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex h-8 items-center", className)}>
      <img
        src={dashboardLogoAsset.url}
        alt="PAVOX Checkout"
        className={cn("h-8 object-contain object-left", compact ? "w-8" : "w-[95px]")}
      />
    </span>
  );
}

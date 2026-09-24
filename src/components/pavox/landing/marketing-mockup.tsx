import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Illustrative mockup of the "Pavox Marketing" area: connected pixels and a
 * tracking-health panel. Visual representation only — no integration status is
 * asserted here.
 */
export function MarketingMockup({ className }: { className?: string }) {
  const pixels = ["Meta Pixel", "Google Ads", "TikTok", "Google Analytics"];
  const events: { label: string; on: boolean }[] = [
    { label: "PageView", on: true },
    { label: "ViewContent", on: true },
    { label: "AddToCart", on: true },
    { label: "InitiateCheckout", on: false },
    { label: "Purchase", on: false },
  ];

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.19_0.02_264)] shadow-[0_40px_120px_-30px_oklch(0.55_0.23_262_/_0.45)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-[12px] font-semibold text-white">Pavox Marketing</span>
        <span className="ml-auto rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-white/50">Pixels & Eventos</span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
        {/* Connected pixels */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Integrações</p>
          <div className="mt-2.5 space-y-2">
            {pixels.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-[10px] font-bold text-primary ring-1 ring-primary/25">
                  {p.charAt(0)}
                </span>
                <span className="text-[12px] text-white/80">{p}</span>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary/60" />
              </div>
            ))}
          </div>
        </div>

        {/* Tracking health */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Saúde do rastreamento</p>
          <div className="mt-3 space-y-2.5">
            {events.map((e) => (
              <div key={e.label} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    e.on ? "animate-dot bg-primary shadow-[0_0_10px_oklch(0.65_0.2_262)]" : "bg-white/15 ring-1 ring-white/20",
                  )}
                />
                <span className={cn("text-[12px]", e.on ? "text-white/85" : "text-white/40")}>{e.label}</span>
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[9.5px] font-medium",
                    e.on ? "bg-primary/12 text-primary" : "bg-white/[0.04] text-white/40",
                  )}
                >
                  {e.on ? "Recebendo" : "Aguardando"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

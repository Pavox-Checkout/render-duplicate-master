import { Check, CreditCard, Layers, Lock, Palette, Sliders, Type } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Illustrative mockup of the PAVOX Checkout Builder: a configuration panel on
 * the left and a live checkout preview on the right. Visual representation only.
 */
export function BuilderMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.19_0.02_264)] shadow-[0_40px_120px_-30px_oklch(0.55_0.23_262_/_0.45)]",
        className,
      )}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
          <Sliders className="h-3.5 w-3.5 text-primary" /> Checkout Builder
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-white/50">Rascunho</span>
          <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
            Publicar
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-0 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Config panel */}
        <div className="space-y-3 border-b border-white/10 p-4 sm:border-b-0 sm:border-r">
          <ConfigRow icon={Type} label="Logo da loja" value="Enviada" />
          <ConfigRow icon={Palette} label="Cor principal">
            <span className="flex gap-1.5">
              <span className="h-4 w-4 rounded-full bg-primary ring-2 ring-primary/40" />
              <span className="h-4 w-4 rounded-full bg-emerald-400/80" />
              <span className="h-4 w-4 rounded-full bg-white/70" />
            </span>
          </ConfigRow>
          <ConfigRow icon={Layers} label="Etapas" value="2 etapas" />
          <ConfigRow icon={CreditCard} label="Pagamento" value="PIX · Cartão" />

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] font-semibold text-white">Blocos de conversão</p>
            <div className="mt-2 space-y-1.5">
              <ToggleLine label="Order Bump" on />
              <ToggleLine label="Upsell" on />
              <ToggleLine label="Prova social" on />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-white/[0.015] p-4">
          <div className="mx-auto max-w-[260px] overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.17_0.02_264)]">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 text-[10px] text-white/45">
              <Lock className="h-3 w-3 text-primary" /> checkout.sualoja.com.br
            </div>
            <div className="space-y-2.5 p-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-primary/20 ring-1 ring-primary/30" />
                <span className="h-2 w-20 rounded bg-white/15" />
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/40 to-primary/5" />
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-4/5 rounded bg-white/15" />
                    <div className="h-1.5 w-1/3 rounded bg-white/10" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/[0.06] p-2 text-[9.5px] text-primary">
                <Check className="h-3 w-3" /> Adicione por + R$ 27,00
              </div>
              <div className="h-7 rounded-md bg-primary text-center text-[10px] font-semibold leading-7 text-primary-foreground">
                Finalizar compra
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="text-[11.5px] text-white/70">{label}</span>
      <span className="ml-auto text-[11px] font-medium text-white/85">{value}</span>
      {children}
    </div>
  );
}

function ToggleLine({ label, on }: { label: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[10.5px] text-white/60">
      <span>{label}</span>
      <span
        className={cn(
          "flex h-3.5 w-6 items-center rounded-full px-0.5 transition-colors",
          on ? "justify-end bg-primary" : "justify-start bg-white/15",
        )}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-white" />
      </span>
    </div>
  );
}

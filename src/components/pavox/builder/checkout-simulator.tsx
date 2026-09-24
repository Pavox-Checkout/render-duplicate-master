import { useState } from "react";
import { FlaskConical, Monitor, RotateCcw, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckoutPreview } from "@/components/pavox/builder/checkout-preview";
import { type CheckoutConfig } from "@/lib/checkout-builder";
import { cn } from "@/lib/utils";

type SimDevice = "desktop" | "mobile";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CheckoutConfig;
  name: string;
};

/**
 * Simulador dedicado do checkout. Abre em tela cheia, permite alternar entre
 * Desktop e Mobile e reiniciar o teste. Renderiza o checkout interativo real
 * (CheckoutRuntime) — sem criar nenhum dado comercial.
 */
export function CheckoutSimulator({ open, onOpenChange, config, name }: Props) {
  const [device, setDevice] = useState<SimDevice>("desktop");
  const [resetKey, setResetKey] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none">
        <DialogHeader className="flex-row flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FlaskConical className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-[14px] leading-tight">Simulador do checkout</DialogTitle>
              <DialogDescription className="text-[11.5px] leading-tight">
                {name || "Checkout"} · dados de teste, sem criar pedidos reais
              </DialogDescription>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              {(
                [
                  { key: "desktop", label: "Desktop", icon: Monitor },
                  { key: "mobile", label: "Mobile", icon: Smartphone },
                ] as { key: SimDevice; label: string; icon: typeof Monitor }[]
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setDevice(key)}
                  aria-label={label}
                  aria-pressed={device === key}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    device === key ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setResetKey((k) => k + 1)}>
              <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Recomeçar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" /> <span className="hidden sm:inline">Fechar</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-secondary/40 p-4 sm:p-6">
          <div
            className={cn(
              "mx-auto overflow-hidden bg-card transition-all duration-300",
              device === "mobile"
                ? "max-w-[400px] rounded-[32px] border-8 border-foreground/85 shadow-[var(--shadow-lift)]"
                : "max-w-[720px] rounded-xl border border-border shadow-[var(--shadow-card)]",
            )}
          >
            <CheckoutPreview key={resetKey} config={config} device={device} mode="test" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

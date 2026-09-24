import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Moldura visual de um checkout, usada como base para os previews em tempo real
 * das ferramentas (faixa de desconto, order bump, provas sociais, escassez...).
 * É puramente ilustrativa.
 *
 * `slotTop`    → conteúdo acima do resumo (ex.: faixa de desconto)
 * `slotMiddle` → conteúdo entre resumo e pagamento (ex.: order bump)
 * `slotBottom` → conteúdo abaixo (ex.: provas sociais, escassez)
 * `overlay`    → conteúdo flutuante sobre o checkout (ex.: compra ao vivo)
 */
export function CheckoutPreviewFrame({
  slotTop,
  slotMiddle,
  slotBottom,
  overlay,
  className,
}: {
  slotTop?: ReactNode;
  slotMiddle?: ReactNode;
  slotBottom?: ReactNode;
  overlay?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-secondary/40">
        <div className="flex items-center gap-1.5 border-b border-border bg-card px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="ml-2 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> checkout.seudominio.com
          </span>
        </div>

        <div className="space-y-3 p-4">
          {slotTop}

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[12px] font-semibold text-muted-foreground">Resumo do pedido</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-11 w-11 rounded-md bg-gradient-to-br from-primary/25 to-primary/5" />
              <div className="min-w-0 flex-1">
                <div className="h-2.5 w-2/3 rounded bg-border" />
                <div className="mt-1.5 h-2 w-1/3 rounded bg-border/70" />
              </div>
              <span className="text-[13px] font-bold">R$ 197,00</span>
            </div>
          </div>

          {slotMiddle}

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[12px] font-semibold text-muted-foreground">Dados de pagamento</p>
            <div className="mt-2 space-y-2">
              <div className="h-8 rounded-md border border-border bg-secondary/50" />
              <div className="h-8 rounded-md border border-border bg-secondary/50" />
            </div>
            <div className="mt-3 flex h-9 items-center justify-center rounded-md bg-primary text-[12.5px] font-semibold text-primary-foreground">
              Finalizar compra
            </div>
          </div>

          {slotBottom}
        </div>
      </div>

      {overlay}
    </div>
  );
}

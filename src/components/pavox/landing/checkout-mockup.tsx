import { Check, CreditCard, Lock, QrCode, ShieldCheck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Realistic, self-contained mockup of a PAVOX checkout window. Purely
 * illustrative — every value shown (store name, product, price) is a visual
 * representation of the interface, not real data.
 */
export function CheckoutMockup({
  className,
  domain = "checkout.sualoja.com.br",
}: {
  className?: string;
  domain?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.19_0.02_264)] shadow-[0_40px_120px_-30px_oklch(0.55_0.23_262_/_0.5)]",
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="mx-auto flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55">
          <Lock className="h-3 w-3 text-primary" />
          {domain}
        </span>
      </div>

      <div className="space-y-3.5 p-4 sm:p-5">
        {/* Store header */}
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <Store className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white">Sua Loja</p>
            <p className="flex items-center gap-1 text-[10.5px] text-white/45">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> Compra 100% segura
            </p>
          </div>
          <span className="ml-auto rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-white/55">
            Etapa 2 de 2
          </span>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 font-medium text-primary">
            <Check className="h-3 w-3" /> Dados
          </span>
          <span className="h-px flex-1 bg-white/10" />
          <span className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 font-medium text-primary-foreground">
            2 Pagamento
          </span>
        </div>

        {/* Order summary */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Resumo do pedido</p>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-primary/40 to-primary/5 ring-1 ring-white/10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">Plano Anual · Método PAVOX</p>
              <p className="text-[11px] text-white/45">1 item</p>
            </div>
            <span className="text-[13.5px] font-bold text-white">R$ 197,00</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary/10 py-2 text-[12px] font-semibold text-primary"
            >
              <QrCode className="h-3.5 w-3.5" /> PIX
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] py-2 text-[12px] font-medium text-white/55"
            >
              <CreditCard className="h-3.5 w-3.5" /> Cartão
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-white p-1.5">
              <div
                className="h-full w-full opacity-90"
                style={{
                  backgroundImage:
                    "conic-gradient(from 0deg, #0a1230 25%, transparent 0 50%, #0a1230 0 75%, transparent 0)",
                  backgroundSize: "5px 5px",
                }}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white">Pague com PIX</p>
              <p className="mt-0.5 text-[10.5px] leading-4 text-white/45">
                Aprovação imediata. Escaneie o QR code ou copie o código.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          className="animate-sheen relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary py-3 text-[13.5px] font-semibold text-primary-foreground shadow-[0_12px_30px_-10px_oklch(0.55_0.23_262_/_0.7)]"
        >
          Pagar R$ 197,00
        </button>

        <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-white/40">
          <Lock className="h-3 w-3" /> Pagamento criptografado e processado com segurança
        </p>
      </div>
    </div>
  );
}

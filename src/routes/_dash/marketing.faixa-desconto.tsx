import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, Percent } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { SettingToggle } from "@/components/pavox/marketing/setting-toggle";
import { MockCheckoutSelect } from "@/components/pavox/marketing/mock-checkout-select";
import { CheckoutPreviewFrame } from "@/components/pavox/marketing/checkout-preview-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dash/marketing/faixa-desconto")({
  component: FaixaDescontoPage,
  head: () => ({
    meta: [
      { title: "Faixa de desconto · PAVOX" },
      {
        name: "description",
        content: "Exiba faixas promocionais no topo do seu checkout para aumentar a conversão.",
      },
    ],
  }),
});

const COLORS = ["#6d28d9", "#0f766e", "#b91c1c", "#c2410c", "#1d4ed8", "#0f172a"];

function FaixaDescontoPage() {
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState("Use o cupom PIX15 e ganhe 15% de desconto à vista!");
  const [color, setColor] = useState(COLORS[0]);
  const [countdown, setCountdown] = useState(true);
  const [checkout, setCheckout] = useState("all");

  return (
    <>
      <PageHeader
        title="Faixa de desconto"
        subtitle="Destaque promoções em uma faixa fixa no topo do checkout, com contagem regressiva opcional."
        actions={
          <Button size="sm" onClick={() => toast.success("Faixa de desconto salva.")}>
            <Save className="h-4 w-4" /> Salvar alterações
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="surface space-y-5 p-5">
          <SettingToggle
            label="Ativar faixa de desconto"
            description="Exibe a faixa no topo do checkout selecionado."
            checked={enabled}
            onCheckedChange={setEnabled}
          />

          <div className="space-y-1.5">
            <Label htmlFor="message">Mensagem</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={90}
            />
            <p className="text-[11.5px] text-muted-foreground">{message.length}/90 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label>Cor de fundo</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Selecionar cor ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition",
                    color === c ? "ring-foreground" : "ring-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <SettingToggle
            label="Exibir contagem regressiva"
            description="Cria senso de urgência com um cronômetro na faixa."
            checked={countdown}
            onCheckedChange={setCountdown}
          />

          <div className="space-y-1.5">
            <Label htmlFor="faixa-checkout">Checkout associado</Label>
            <MockCheckoutSelect id="faixa-checkout" value={checkout} onChange={setCheckout} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
            Pré-visualização
          </p>
          <CheckoutPreviewFrame
            slotTop={
              enabled ? (
                <div
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center text-[12.5px] font-semibold text-white"
                  style={{ backgroundColor: color }}
                >
                  <Percent className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{message || "Sua mensagem promocional"}</span>
                  {countdown ? (
                    <span className="ml-1 shrink-0 rounded bg-white/20 px-1.5 py-0.5 font-mono text-[11px]">
                      00:14:59
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-center text-[12px] text-muted-foreground">
                  Faixa desativada
                </div>
              )
            }
          />
        </div>
      </div>
    </>
  );
}

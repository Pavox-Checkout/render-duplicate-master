import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, QrCode, CreditCard, Barcode } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { SettingToggle } from "@/components/pavox/marketing/setting-toggle";
import { CheckoutPreviewFrame } from "@/components/pavox/marketing/checkout-preview-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_dash/marketing/sugestoes-pagamento")({
  component: SugestoesPagamentoPage,
  head: () => ({
    meta: [
      { title: "Sugestões de pagamento · PAVOX" },
      {
        name: "description",
        content: "Incentive o meio de pagamento mais vantajoso com destaques e descontos no checkout.",
      },
    ],
  }),
});

function SugestoesPagamentoPage() {
  const [highlightPix, setHighlightPix] = useState(true);
  const [pixDiscount, setPixDiscount] = useState("5");
  const [showInstallments, setShowInstallments] = useState(true);
  const [hideBoleto, setHideBoleto] = useState(false);

  return (
    <>
      <PageHeader
        title="Sugestões de pagamento"
        subtitle="Direcione o cliente para o meio de pagamento com melhor taxa de aprovação e menor custo."
        actions={
          <Button size="sm" onClick={() => toast.success("Sugestões de pagamento salvas.")}>
            <Save className="h-4 w-4" /> Salvar alterações
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="surface space-y-5 p-5">
          <SettingToggle
            label="Destacar Pix"
            description="Exibe o Pix como opção recomendada no topo dos meios de pagamento."
            checked={highlightPix}
            onCheckedChange={setHighlightPix}
          />

          <div className="space-y-1.5">
            <Label htmlFor="pix-discount">Desconto no Pix (%)</Label>
            <Input
              id="pix-discount"
              value={pixDiscount}
              onChange={(e) => setPixDiscount(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="max-w-[140px]"
            />
            <p className="text-[11.5px] text-muted-foreground">
              Aplicado automaticamente quando o cliente escolhe Pix.
            </p>
          </div>

          <SettingToggle
            label="Mostrar parcelamento no cartão"
            description="Exibe as opções de parcelas diretamente no botão do cartão."
            checked={showInstallments}
            onCheckedChange={setShowInstallments}
          />

          <SettingToggle
            label="Ocultar boleto"
            description="Remove o boleto para incentivar pagamentos instantâneos."
            checked={hideBoleto}
            onCheckedChange={setHideBoleto}
          />
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
            Pré-visualização
          </p>
          <CheckoutPreviewFrame
            slotMiddle={
              <div className="space-y-2">
                <div
                  className={
                    highlightPix
                      ? "flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 px-3 py-2.5"
                      : "flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                  }
                >
                  <span className="flex items-center gap-2 text-[12.5px] font-semibold">
                    <QrCode className="h-4 w-4" /> Pix
                  </span>
                  {highlightPix && Number(pixDiscount) > 0 ? (
                    <span className="rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-semibold text-success">
                      {pixDiscount}% OFF
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <span className="flex items-center gap-2 text-[12.5px] font-medium">
                    <CreditCard className="h-4 w-4" /> Cartão de crédito
                  </span>
                  {showInstallments ? (
                    <span className="text-[11px] text-muted-foreground">até 12x</span>
                  ) : null}
                </div>

                {!hideBoleto ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-[12.5px] font-medium">
                    <Barcode className="h-4 w-4" /> Boleto bancário
                  </div>
                ) : null}
              </div>
            }
          />
        </div>
      </div>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { SettingToggle } from "@/components/pavox/marketing/setting-toggle";
import { CheckoutPreviewFrame } from "@/components/pavox/marketing/checkout-preview-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIVE_PURCHASES } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/compra-ao-vivo")({
  component: CompraAoVivoPage,
  head: () => ({
    meta: [
      { title: "Compra ao vivo · PAVOX" },
      {
        name: "description",
        content: "Notificações de compras recentes exibidas em tempo real no checkout.",
      },
    ],
  }),
});

function CompraAoVivoPage() {
  const [enabled, setEnabled] = useState(true);
  const [showCity, setShowCity] = useState(true);
  const [interval, setInterval] = useState("8");
  const [position, setPosition] = useState("bottom-left");
  const sample = LIVE_PURCHASES[0];

  return (
    <>
      <PageHeader
        title="Compra ao vivo"
        subtitle="Exiba notificações de compras recentes para gerar prova social em tempo real."
        actions={
          <Button size="sm" onClick={() => toast.success("Compra ao vivo salva.")}>
            <Save className="h-4 w-4" /> Salvar alterações
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="surface space-y-5 p-5">
          <SettingToggle
            label="Ativar notificações de compra"
            description="Exibe pop-ups de compras recentes durante a navegação no checkout."
            checked={enabled}
            onCheckedChange={setEnabled}
          />

          <SettingToggle
            label="Exibir cidade do comprador"
            description="Mostra a cidade para reforçar a autenticidade da notificação."
            checked={showCity}
            onCheckedChange={setShowCity}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="interval">Intervalo (segundos)</Label>
              <Input
                id="interval"
                value={interval}
                onChange={(e) => setInterval(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Posição</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger id="position" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-left">Inferior esquerdo</SelectItem>
                  <SelectItem value="bottom-right">Inferior direito</SelectItem>
                  <SelectItem value="top-left">Superior esquerdo</SelectItem>
                  <SelectItem value="top-right">Superior direito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
            Pré-visualização
          </p>
          <CheckoutPreviewFrame
            slotBottom={
              enabled && sample ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-lift)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                    <ShoppingBag className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold">
                      {sample.name}
                      {showCity ? (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          de {sample.city}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      Comprou {sample.product} · {sample.time}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
                  Notificações desativadas
                </div>
              )
            }
          />
        </div>
      </div>
    </>
  );
}

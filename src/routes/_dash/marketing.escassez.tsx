import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, Timer, Flame } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { SettingToggle } from "@/components/pavox/marketing/setting-toggle";
import { CheckoutPreviewFrame } from "@/components/pavox/marketing/checkout-preview-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_dash/marketing/escassez")({
  component: EscassezPage,
  head: () => ({
    meta: [
      { title: "Escassez · PAVOX" },
      {
        name: "description",
        content: "Crie urgência no checkout com contagem regressiva e aviso de estoque limitado.",
      },
    ],
  }),
});

function EscassezPage() {
  const [timerOn, setTimerOn] = useState(true);
  const [minutes, setMinutes] = useState("15");
  const [stockOn, setStockOn] = useState(true);
  const [stockLeft, setStockLeft] = useState("7");

  return (
    <>
      <PageHeader
        title="Escassez"
        subtitle="Estimule decisões rápidas com cronômetro de oferta e indicadores de estoque limitado."
        actions={
          <Button size="sm" onClick={() => toast.success("Escassez salva.")}>
            <Save className="h-4 w-4" /> Salvar alterações
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="space-y-4">
          <div className="surface space-y-4 p-5">
            <SettingToggle
              label="Contagem regressiva"
              description="Exibe um cronômetro de expiração da oferta no checkout."
              checked={timerOn}
              onCheckedChange={setTimerOn}
            />
            <div className="space-y-1.5">
              <Label htmlFor="minutes">Duração (minutos)</Label>
              <Input
                id="minutes"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="max-w-[140px]"
              />
            </div>
          </div>

          <div className="surface space-y-4 p-5">
            <SettingToggle
              label="Estoque limitado"
              description="Mostra quantas unidades ainda restam disponíveis."
              checked={stockOn}
              onCheckedChange={setStockOn}
            />
            <div className="space-y-1.5">
              <Label htmlFor="stock">Unidades restantes</Label>
              <Input
                id="stock"
                value={stockLeft}
                onChange={(e) => setStockLeft(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="max-w-[140px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
            Pré-visualização
          </p>
          <CheckoutPreviewFrame
            slotTop={
              timerOn ? (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-[12.5px] font-semibold text-destructive">
                  <Timer className="h-4 w-4" />
                  Oferta expira em
                  <span className="rounded bg-destructive px-1.5 py-0.5 font-mono text-white">
                    {String(Math.min(Number(minutes) || 0, 99)).padStart(2, "0")}:00
                  </span>
                </div>
              ) : undefined
            }
            slotMiddle={
              stockOn ? (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[12.5px] font-semibold text-amber-700 dark:text-amber-400">
                  <Flame className="h-4 w-4" />
                  Restam apenas {stockLeft || 0} unidades!
                </div>
              ) : undefined
            }
          />
        </div>
      </div>
    </>
  );
}

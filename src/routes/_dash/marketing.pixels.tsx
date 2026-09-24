import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Activity, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { ToolStatusBadge } from "@/components/pavox/marketing/tool-status-badge";
import { SettingToggle } from "@/components/pavox/marketing/setting-toggle";
import { MockCheckoutSelect } from "@/components/pavox/marketing/mock-checkout-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PIXEL_PLATFORMS,
  PIXEL_EVENTS,
  CHECKOUT_EVENTS,
  type PixelPlatform,
} from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/pixels")({
  component: PixelsPage,
  head: () => ({
    meta: [
      { title: "Pixels e rastreamento · PAVOX" },
      {
        name: "description",
        content:
          "Conecte Meta, Google, TikTok e outras plataformas para rastrear eventos do seu checkout.",
      },
    ],
  }),
});

function PixelsPage() {
  const [active, setActive] = useState<PixelPlatform | null>(null);

  return (
    <>
      <PageHeader
        title="Pixels e rastreamento"
        subtitle="Conecte plataformas de anúncios e dispare eventos de conversão diretamente do seu checkout PAVOX."
        actions={
          <Button size="sm" onClick={() => setActive(PIXEL_PLATFORMS[0] ?? null)}>
            <Plus className="h-4 w-4" /> Adicionar pixel
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PIXEL_PLATFORMS.map((p) => {
          const connected = p.status === "Ativo" || p.status === "Configurando" || p.status === "Erro";
          return (
            <div
              key={p.id}
              className="surface flex flex-col p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                  style={{ backgroundColor: p.color }}
                  aria-hidden
                >
                  {p.tag}
                </span>
                <ToolStatusBadge status={p.status} />
              </div>

              <h3 className="mt-3 text-[14.5px] font-semibold">{p.name}</h3>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{p.description}</p>

              <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                {p.lastEvent ?? "Nenhum evento registrado"}
              </div>

              <div className="mt-3 flex-1" />
              <Button
                variant={connected ? "outline" : "default"}
                size="sm"
                className="w-full"
                onClick={() => setActive(p)}
              >
                {connected ? "Gerenciar" : "Conectar"}
              </Button>
            </div>
          );
        })}
      </div>

      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold">Eventos rastreados no checkout</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Mapeamento das etapas do seu checkout para os eventos enviados às plataformas conectadas.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {CHECKOUT_EVENTS.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-[13px]">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {e.label}
              </span>
              <code className="rounded bg-secondary px-1.5 py-0.5 text-[11.5px] font-medium text-muted-foreground">
                {e.event}
              </code>
            </div>
          ))}
        </div>
      </section>

      <PixelConfigDialog platform={active} onClose={() => setActive(null)} />
    </>
  );
}

function PixelConfigDialog({
  platform,
  onClose,
}: {
  platform: PixelPlatform | null;
  onClose: () => void;
}) {
  const [checkout, setCheckout] = useState("all");
  const [events, setEvents] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PIXEL_EVENTS.map((e) => [e.id, e.active])),
  );

  return (
    <Dialog open={!!platform} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {platform ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                  style={{ backgroundColor: platform.color }}
                  aria-hidden
                >
                  {platform.tag}
                </span>
                <div>
                  <DialogTitle>{platform.name}</DialogTitle>
                  <DialogDescription>{platform.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="pixel-id">ID do pixel</Label>
                <Input id="pixel-id" placeholder="Ex.: 1234567890" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pixel-token">Token de API de conversões (opcional)</Label>
                <Input id="pixel-token" placeholder="Cole seu token de acesso" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pixel-checkout">Checkout associado</Label>
                <MockCheckoutSelect id="pixel-checkout" value={checkout} onChange={setCheckout} />
              </div>

              <div className="space-y-2">
                <Label>Eventos enviados</Label>
                <div className="space-y-2">
                  {PIXEL_EVENTS.map((e) => (
                    <SettingToggle
                      key={e.id}
                      label={e.label}
                      description={e.description}
                      checked={events[e.id] ?? false}
                      onCheckedChange={(v) => setEvents((prev) => ({ ...prev, [e.id]: v }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  toast.success(`Pixel ${platform.name} salvo com sucesso.`);
                  onClose();
                }}
              >
                Salvar pixel
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

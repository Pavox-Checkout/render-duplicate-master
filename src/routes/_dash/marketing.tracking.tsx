import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Info,
  Link2,
  Plug,
  Settings2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { TrackingLogo } from "@/components/pavox/marketing/tracking-logo";
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
  TRACKING_PLATFORMS,
  TRACKING_COMING_SOON,
  PIXEL_EVENTS,
  type TrackingPlatform,
} from "@/lib/marketing-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dash/marketing/tracking")({
  component: TrackingPage,
  head: () => ({
    meta: [
      { title: "Tracking e atribuição · PAVOX" },
      {
        name: "description",
        content:
          "Conecte UTMify, Otimizey e Wetracked para rastrear e atribuir a origem das suas vendas no checkout PAVOX.",
      },
    ],
  }),
});

function TrackingPage() {
  const [active, setActive] = useState<TrackingPlatform | null>(null);
  /** Conexões configuradas nesta sessão (não persistidas — ver aviso na tela). */
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const featured = TRACKING_PLATFORMS.find((p) => p.featured);
  const others = TRACKING_PLATFORMS.filter((p) => !p.featured);

  return (
    <>
      <PageHeader
        title="Tracking e atribuição"
        subtitle="Conecte suas principais ferramentas de rastreamento e acompanhe a origem das suas vendas."
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-accent/60 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Você já pode configurar credenciais, checkouts e eventos de cada
          plataforma. O <span className="font-medium text-foreground">envio automático de eventos</span>{" "}
          é habilitado assim que a integração é concluída — nenhuma plataforma é
          exibida como ativa sem uma conexão real.
        </p>
      </div>

      {featured ? (
        <FeaturedCard
          platform={featured}
          connected={!!connected[featured.id]}
          onConfigure={() => setActive(featured)}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Outras plataformas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((p) => (
            <PlatformCard
              key={p.id}
              platform={p}
              connected={!!connected[p.id]}
              onConfigure={() => setActive(p)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold">Em breve</h2>
          <span className="text-[12px] text-muted-foreground">
            Novas integrações de tracking em desenvolvimento
          </span>
        </div>
        <div className="surface flex flex-wrap gap-2 p-4">
          {TRACKING_COMING_SOON.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-secondary/40 px-3 py-1.5 text-[12px] font-medium text-muted-foreground"
            >
              {name}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Em breve
              </span>
            </span>
          ))}
        </div>
      </section>

      <TrackingConfigDialog
        platform={active}
        connected={active ? !!connected[active.id] : false}
        onClose={() => setActive(null)}
        onSave={(id) => {
          setConnected((prev) => ({ ...prev, [id]: true }));
          setActive(null);
        }}
        onDisconnect={(id) => {
          setConnected((prev) => ({ ...prev, [id]: false }));
          setActive(null);
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Card de destaque (UTMify)                                                  */
/* -------------------------------------------------------------------------- */

function FeaturedCard({
  platform,
  connected,
  onConfigure,
}: {
  platform: TrackingPlatform;
  connected: boolean;
  onConfigure: () => void;
}) {
  return (
    <section className="surface relative overflow-hidden p-5 sm:p-6">
      <span
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.07] blur-2xl"
        style={{ backgroundColor: platform.accent }}
        aria-hidden
      />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <TrackingLogo id={platform.id} size={56} className="rounded-2xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-semibold">{platform.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Recomendada
              </span>
              <ConnectionPill connected={connected} />
            </div>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              {platform.longDescription ?? platform.description}
            </p>
            {platform.benefits ? (
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {platform.benefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-1.5 text-[12.5px] text-foreground/90"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-stretch">
          <Button className="lg:w-44" onClick={onConfigure}>
            {connected ? (
              <>
                <Settings2 className="h-4 w-4" /> Gerenciar
              </>
            ) : (
              <>
                <Plug className="h-4 w-4" /> Conectar UTMify
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Card padrão                                                                */
/* -------------------------------------------------------------------------- */

function PlatformCard({
  platform,
  connected,
  onConfigure,
}: {
  platform: TrackingPlatform;
  connected: boolean;
  onConfigure: () => void;
}) {
  return (
    <div className="surface flex flex-col p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between">
        <TrackingLogo id={platform.id} size={44} />
        <ConnectionPill connected={connected} />
      </div>
      <h3 className="mt-3 text-[14.5px] font-semibold">{platform.name}</h3>
      <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
        {platform.description}
      </p>
      <div className="mt-3 flex-1" />
      <Button
        variant={connected ? "outline" : "default"}
        size="sm"
        className="w-full"
        onClick={onConfigure}
      >
        {connected ? (
          <>
            <Settings2 className="h-4 w-4" /> Gerenciar
          </>
        ) : (
          <>
            <Plug className="h-4 w-4" /> Conectar
          </>
        )}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Indicador de conexão                                                       */
/* -------------------------------------------------------------------------- */

function ConnectionPill({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
        connected
          ? "border-success/20 bg-success/12 text-success"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          connected ? "bg-success" : "bg-muted-foreground/60",
        )}
      />
      {connected ? "Configurado" : "Não conectado"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog de configuração                                                     */
/* -------------------------------------------------------------------------- */

function TrackingConfigDialog({
  platform,
  connected,
  onClose,
  onSave,
  onDisconnect,
}: {
  platform: TrackingPlatform | null;
  connected: boolean;
  onClose: () => void;
  onSave: (id: string) => void;
  onDisconnect: (id: string) => void;
}) {
  const [checkout, setCheckout] = useState("all");
  const [credential, setCredential] = useState("");
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
                <TrackingLogo id={platform.id} size={44} />
                <div>
                  <DialogTitle>{platform.name}</DialogTitle>
                  <DialogDescription>{platform.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="tracking-credential">{platform.credentialLabel}</Label>
                <Input
                  id="tracking-credential"
                  type="password"
                  placeholder={platform.credentialPlaceholder}
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tracking-checkout">Checkout associado</Label>
                <MockCheckoutSelect
                  id="tracking-checkout"
                  value={checkout}
                  onChange={setCheckout}
                />
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
                      onCheckedChange={(v) =>
                        setEvents((prev) => ({ ...prev, [e.id]: v }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  A configuração é salva na sua conta. O envio automático de
                  eventos para a {platform.name} é ativado quando a integração é
                  concluída — nenhum evento é enviado antes disso.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  toast.info(
                    "O teste de conexão fica disponível assim que a integração for ativada.",
                  );
                }}
              >
                <Link2 className="h-4 w-4" /> Testar conexão
              </Button>
              <div className="flex gap-2">
                {connected ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onDisconnect(platform.id);
                      toast.success(`${platform.name} desconectada.`);
                    }}
                  >
                    Desconectar
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => {
                    onSave(platform.id);
                    toast.success(`Configuração da ${platform.name} salva.`);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Salvar
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

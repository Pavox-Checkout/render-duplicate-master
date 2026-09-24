import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  Eye,
  FlaskConical,
  Loader2,
  Monitor,
  Package,
  Rocket,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfigSidebar } from "@/components/pavox/builder/config-sidebar";
import { CheckoutPreview } from "@/components/pavox/builder/checkout-preview";
import { CheckoutRuntime } from "@/components/pavox/builder/checkout-runtime";
import { CheckoutSimulator } from "@/components/pavox/builder/checkout-simulator";
import {
  PRESETS,
  RECOMMENDATIONS,
  applyPreset,
  type CheckoutConfig,
  type Device,
  type PresetKey,
  type ProductKind,
} from "@/lib/checkout-builder";
import {
  publishCheckout,
  saveCheckout,
  slugify,
  stateFromConfig,
  type CheckoutRecord,
} from "@/lib/checkouts-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SaveState = "saved" | "saving";

const DEVICES: { key: Device; label: string; icon: typeof Monitor }[] = [
  { key: "desktop", label: "Desktop", icon: Monitor },
  { key: "tablet", label: "Tablet", icon: Tablet },
  { key: "mobile", label: "Mobile", icon: Smartphone },
];

const PRODUCT_KINDS: { key: ProductKind; label: string; icon: typeof Package }[] = [
  { key: "digital", label: "Digital", icon: Cloud },
  { key: "physical", label: "Físico", icon: Package },
];

export function BuilderEditor({ checkout }: { checkout: CheckoutRecord }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState(() => stateFromConfig(checkout));
  const [device, setDevice] = useState<Device>("desktop");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"design" | "test">("design");
  const first = useRef(true);

  const config = state.config;
  const url = `checkout.pavox.com/c/${slugify(state.name) || "checkout"}`;

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["checkouts"] });
    void queryClient.invalidateQueries({ queryKey: ["checkout", checkout.id] });
  }, [queryClient, checkout.id]);

  // salvamento automático
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => {
      saveCheckout(checkout.id, state)
        .then(() => {
          setSaveState("saved");
          invalidate();
        })
        .catch(() => {
          setSaveState("saved");
          toast.error("Não foi possível salvar as alterações.");
        });
    }, 800);
    return () => clearTimeout(t);
  }, [state, checkout.id, invalidate]);

  const updateConfig = useCallback(
    (patch: Partial<CheckoutConfig>) => setState((s) => ({ ...s, config: { ...s.config, ...patch } })),
    [],
  );

  const choosePreset = (key: PresetKey) => {
    setState((s) => ({ ...s, config: applyPreset(s.config, key) }));
    const preset = PRESETS.find((p) => p.key === key);
    toast.success(`Modelo ${preset?.label ?? ""} aplicado`, { description: "Personalize tudo à esquerda." });
  };

  const toggleMode = () => updateConfig({ mode: config.mode === "quick" ? "advanced" : "quick" });

  const setProductKind = (kind: ProductKind) =>
    updateConfig({ product: { ...config.product, kind } });

  const saveNow = async () => {
    setSaveState("saving");
    try {
      await saveCheckout(checkout.id, state);
      invalidate();
      toast.success("Checkout salvo");
    } catch {
      toast.error("Não foi possível salvar o checkout.");
    } finally {
      setSaveState("saved");
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await publishCheckout(checkout.id, state);
      setState((s) => ({ ...s, status: "Publicado" }));
      invalidate();
      setPublishOpen(true);
    } catch {
      toast.error("Não foi possível publicar o checkout.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="-mx-1 flex min-h-[calc(100vh-7rem)] flex-col gap-3">
      {/* TOPO */}
      <div className="surface flex flex-wrap items-center gap-3 px-3 py-2.5">
        <Button asChild variant="ghost" size="sm" className="-ml-1 shrink-0">
          <Link to="/checkouts">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
        </Button>

        <div className="hidden h-6 w-px bg-border sm:block" />

        <div className="flex min-w-0 items-center gap-2">
          <Label htmlFor="cname" className="sr-only">
            Nome do checkout
          </Label>
          <Input
            id="cname"
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
            className="h-8 w-[150px] border-transparent bg-transparent px-2 text-[14px] font-semibold hover:border-border focus-visible:border-border"
          />
          <Badge variant={state.status === "Publicado" ? "default" : "secondary"}>{state.status}</Badge>
        </div>

        <span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground md:flex">
          {saveState === "saving" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-[oklch(0.62_0.16_152)]" /> Salvo
            </>
          )}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* modo rápido / avançado */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => config.mode !== "quick" && toggleMode()}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                config.mode === "quick" ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Zap className="h-3.5 w-3.5" /> Rápido
            </button>
            <button
              onClick={() => config.mode !== "advanced" && toggleMode()}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                config.mode === "advanced" ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Avançado
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => void saveNow()}>
            <Save className="h-4 w-4" /> <span className="hidden sm:inline">Salvar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Visualizar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSimulatorOpen(true)}>
            <FlaskConical className="h-4 w-4" /> <span className="hidden sm:inline">Testar checkout</span>
          </Button>
          <Button size="sm" onClick={() => void publish()} disabled={publishing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Publicar
          </Button>
        </div>
      </div>

      {/* EDITOR */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(340px,376px)_minmax(0,1fr)]">
        {/* COLUNA DE CONFIGURAÇÃO */}
        <div className="surface flex max-h-[70vh] min-h-0 flex-col overflow-hidden lg:max-h-none">
          {/* seletor de modelo */}
          <div className="border-b border-border p-3">
            <p className="mb-2 text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Modelo do checkout
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => choosePreset(p.key)}
                  title={p.hint}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
                    config.preset === p.key ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/60",
                  )}
                >
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: p.accent }} />
                  <span className="text-[12px] font-semibold">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* seções */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConfigSidebar config={config} update={updateConfig} />
          </div>

          {/* pavox intelligence */}
          <div className="border-t border-border bg-accent/40 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-[12.5px] font-semibold">Pavox Intelligence</p>
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {RECOMMENDATIONS.length} recomendações de conversão
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setTipsOpen(true)}>
              Ver recomendações
            </Button>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="surface flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-3 py-2">
            <span className="text-[12px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">Preview</span>
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              {(
                [
                  { key: "design", label: "Design" },
                  { key: "test", label: "Teste" },
                ] as { key: "design" | "test"; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPreviewMode(key)}
                  aria-pressed={previewMode === key}
                  title={key === "test" ? "Preencha e navegue pelo checkout" : "Visualização em tempo real"}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    previewMode === key ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label === "Teste" ? <FlaskConical className="h-3.5 w-3.5" /> : null}
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1 rounded-lg bg-secondary p-1">
              {PRODUCT_KINDS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setProductKind(key)}
                  aria-label={`Produto ${label}`}
                  aria-pressed={config.product.kind === key}
                  title={key === "physical" ? "Inclui etapa de entrega" : "Sem etapa de entrega"}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    config.product.kind === key ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              {DEVICES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setDevice(key)}
                  aria-label={label}
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
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-secondary/40 p-4">
            <div
              className={cn(
                "mx-auto overflow-hidden transition-all duration-300",
                device === "mobile" && "max-w-[400px] rounded-[32px] border-8 border-foreground/85 shadow-[var(--shadow-lift)]",
                device === "tablet" && "max-w-[680px] rounded-2xl border-[6px] border-foreground/80",
                device === "desktop" && "max-w-full rounded-xl border border-border",
              )}
            >
              {previewMode === "test" ? (
                <CheckoutRuntime config={config} device={device} />
              ) : (
                <CheckoutPreview config={config} device={device} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VISUALIZAR */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none">
          <DialogHeader className="flex-row items-center gap-3 border-b border-border bg-background px-4 py-2.5">
            <DialogTitle className="text-[14px]">Prévia do comprador</DialogTitle>
            <DialogDescription className="sr-only">Visualização do checkout que o cliente verá.</DialogDescription>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => setPreviewOpen(false)}>
              <X className="h-4 w-4" /> Voltar para o editor
            </Button>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CheckoutPreview config={config} device="desktop" interactive={false} />
          </div>
        </DialogContent>
      </Dialog>

      {/* PUBLICAR */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.62_0.16_152)]/12">
              <CheckCircle2 className="h-5 w-5 text-[oklch(0.62_0.16_152)]" />
            </div>
            <DialogTitle>Seu checkout está pronto</DialogTitle>
            <DialogDescription>Seu checkout foi publicado e está pronto para receber clientes.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-secondary/60 px-3 py-2.5 font-mono text-[12.5px] break-all">
            {url}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                navigator.clipboard?.writeText(`https://${url}`);
                toast.success("Link copiado");
              }}
            >
              <Copy className="h-4 w-4" /> Copiar link
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPublishOpen(false);
                setPreviewOpen(true);
              }}
            >
              <Eye className="h-4 w-4" /> Abrir checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* RECOMENDAÇÕES */}
      <Dialog open={tipsOpen} onOpenChange={setTipsOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Pavox Intelligence
            </DialogTitle>
            <DialogDescription>Sugestões baseadas no comportamento médio de checkouts parecidos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {RECOMMENDATIONS.map((r) => (
              <div key={r.title} className="rounded-lg border border-border p-3">
                <p className="text-[13px] font-semibold">{r.title}</p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* SIMULADOR DEDICADO */}
      <CheckoutSimulator open={simulatorOpen} onOpenChange={setSimulatorOpen} config={config} name={state.name} />
    </div>
  );
}

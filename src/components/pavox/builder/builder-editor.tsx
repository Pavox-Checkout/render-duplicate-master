import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Loader2,
  Monitor,
  MousePointerClick,
  Rocket,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ElementLibrary } from "@/components/pavox/builder/element-library";
import { CheckoutPreview } from "@/components/pavox/builder/checkout-preview";
import { Inspector } from "@/components/pavox/builder/inspector";
import { AppearancePanel } from "@/components/pavox/builder/appearance-panel";
import {
  BLOCK_LABELS,
  RECOMMENDATIONS,
  createBlock,
  type Appearance,
  type BlockData,
  type BlockType,
  type BuilderState,
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
const DEVICES = [
  { key: "desktop", label: "Desktop", icon: Monitor },
  { key: "tablet", label: "Tablet", icon: Tablet },
  { key: "mobile", label: "Mobile", icon: Smartphone },
] as const;

export function BuilderEditor({ checkout }: { checkout: CheckoutRecord }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BuilderState>(() => stateFromConfig(checkout));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [tab, setTab] = useState("elemento");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const first = useRef(true);

  const selected = useMemo(
    () => state.blocks.find((b) => b.id === selectedId) ?? null,
    [state.blocks, selectedId],
  );
  const url = `checkout.pavox.com/c/${slugify(state.name) || "checkout"}`;

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["checkouts"] });
    void queryClient.invalidateQueries({ queryKey: ["checkout", checkout.id] });
  }, [queryClient, checkout.id]);

  // salvamento automático no banco
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

  const updateBlock = useCallback(
    (id: string, patch: Partial<BlockData>) =>
      setState((s) => ({
        ...s,
        blocks: s.blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)),
      })),
    [],
  );

  const addBlock = (type: BlockType) => {
    const block = createBlock(type);
    setState((s) => ({ ...s, blocks: [...s.blocks, block] }));
    setSelectedId(block.id);
    setTab("elemento");
    toast.success(`${BLOCK_LABELS[type]} adicionado`, { description: "Ajuste no painel à direita." });
  };

  const removeBlock = (id: string) => {
    const b = state.blocks.find((x) => x.id === id);
    setState((s) => ({ ...s, blocks: s.blocks.filter((x) => x.id !== id) }));
    if (selectedId === id) setSelectedId(null);
    if (b) toast(`${BLOCK_LABELS[b.type]} removido`);
  };

  const reorder = (from: number, to: number) => {
    setState((s) => {
      const blocks = [...s.blocks];
      const [moved] = blocks.splice(from, 1);
      if (moved) blocks.splice(to, 0, moved);
      return { ...s, blocks };
    });
    toast("Ordem atualizada");
  };

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
            <span className="hidden sm:inline">Voltar para checkouts</span>
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
            className="h-8 w-[170px] border-transparent bg-transparent px-2 text-[14px] font-semibold hover:border-border focus-visible:border-border"
          />
          <Badge variant={state.status === "Publicado" ? "default" : "secondary"}>{state.status}</Badge>
        </div>

        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {saveState === "saving" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-[oklch(0.62_0.16_152)]" /> Alterações salvas
            </>
          )}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void saveNow()}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" /> Visualizar
          </Button>
          <Button size="sm" onClick={() => void publish()} disabled={publishing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Publicar checkout
          </Button>
        </div>
      </div>

      {/* EDITOR */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[236px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)_312px]">
        <div className="surface flex max-h-[520px] min-h-0 flex-col overflow-hidden lg:max-h-none">
          <ElementLibrary
            blocks={state.blocks}
            selectedId={selectedId}
            onAdd={addBlock}
            onSelect={(id) => {
              setSelectedId(id);
              setTab("elemento");
            }}
            onRemove={removeBlock}
            onReorder={reorder}
          />
        </div>

        {/* PREVIEW */}
        <div className="surface flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-3 py-2">
            <span className="text-[12px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Preview
            </span>
            <div className="ml-auto flex items-center gap-1 rounded-lg bg-secondary p-1">
              {DEVICES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setDevice(key)}
                  aria-label={label}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    device === key
                      ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-secondary/40 p-4">
            {state.blocks.length === 0 ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
                <MousePointerClick className="h-6 w-6 text-muted-foreground" />
                <p className="text-[13.5px] font-medium">Seu checkout está vazio</p>
                <p className="max-w-[260px] text-[12.5px] text-muted-foreground">
                  Adicione elementos pelo painel à esquerda para começar a montar a página.
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "mx-auto transition-all duration-300",
                  device === "mobile" &&
                    "max-w-[400px] overflow-hidden rounded-[32px] border-8 border-foreground/85 shadow-[var(--shadow-lift)]",
                  device === "tablet" && "max-w-[680px] overflow-hidden rounded-2xl border-[6px] border-foreground/80",
                )}
              >
                <CheckoutPreview
                  state={state}
                  device={device}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setTab("elemento");
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* PAINEL DIREITO */}
        <div className="surface flex max-h-[640px] min-h-0 flex-col overflow-hidden xl:max-h-none">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b border-border px-3 py-2.5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="elemento">Elemento</TabsTrigger>
                <TabsTrigger value="aparencia">Aparência</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="elemento" className="min-h-0 flex-1 overflow-y-auto p-4">
              {selected ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Editando
                    </p>
                    <h3 className="font-semibold">{BLOCK_LABELS[selected.type]}</h3>
                  </div>
                  <Inspector block={selected} update={(patch) => updateBlock(selected.id, patch)} />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <MousePointerClick className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13.5px] font-semibold">Selecione um elemento</p>
                  <p className="max-w-[220px] text-[12px] text-muted-foreground">
                    Clique em qualquer bloco do checkout para editar suas configurações.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="aparencia" className="min-h-0 flex-1 overflow-y-auto p-4">
              <AppearancePanel
                appearance={state.appearance}
                onChange={(patch: Partial<Appearance>) =>
                  setState((s) => ({ ...s, appearance: { ...s.appearance, ...patch } }))
                }
              />
            </TabsContent>
          </Tabs>

          {/* PAVOX INTELLIGENCE */}
          <div className="border-t border-border bg-accent/40 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-[12.5px] font-semibold">Pavox Intelligence</p>
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {RECOMMENDATIONS.length} recomendações encontradas
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setTipsOpen(true)}>
              Ver recomendações
            </Button>
          </div>
        </div>
      </div>

      {/* VISUALIZAR */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none">
          <DialogHeader className="flex-row items-center gap-3 border-b border-border bg-background px-4 py-2.5">
            <DialogTitle className="text-[14px]">Prévia do comprador</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização exata do checkout que o cliente final verá.
            </DialogDescription>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => setPreviewOpen(false)}>
              <X className="h-4 w-4" /> Voltar para o editor
            </Button>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CheckoutPreview state={state} device="desktop" interactive={false} />
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
            <DialogDescription>
              Seu checkout foi publicado e está pronto para receber clientes.
            </DialogDescription>
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
            <DialogDescription>
              Sugestões geradas a partir do comportamento médio de checkouts parecidos.
            </DialogDescription>
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
    </div>
  );
}

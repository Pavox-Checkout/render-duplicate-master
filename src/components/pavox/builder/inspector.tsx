import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ADDRESS_FIELDS,
  CUSTOMER_FIELDS,
  FIELD_LABELS,
  LIVE_PHRASES,
  newId,
  type Align,
  type Block,
  type BlockData,
  type CheckoutStep,
  type FieldKey,
  type Testimonial,
} from "@/lib/checkout-builder";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";

/* ─────────────────────────── helpers de UI ─────────────────────────── */

function Group({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-[12px] font-semibold tracking-[0.04em] uppercase text-muted-foreground">
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 border-t border-border px-3 py-3.5">{children}</div>}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <Label className="text-[13px] font-normal">{label}</Label>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function AlignPicker({ value, onChange }: { value?: Align | undefined; onChange: (v: Align) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
      {(["left", "center", "right"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md py-1.5 text-[12px] font-medium transition-colors",
            (value ?? "center") === v
              ? "bg-card text-foreground shadow-[var(--shadow-card)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v === "left" ? "Esquerda" : v === "center" ? "Centro" : "Direita"}
        </button>
      ))}
    </div>
  );
}

const COLOR_SWATCHES = ["#16a34a", "#2563eb", "#0f172a", "#db2777", "#f59e0b", "#7c3aed"];

function ColorRow({ label, value, onChange }: { label: string; value?: string | undefined; onChange: (v: string) => void }) {
  const v = value ?? "#16a34a";
  return (
    <Row label={label}>
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            aria-label={`${label} ${c}`}
            onClick={() => onChange(c)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
              v.toLowerCase() === c ? "border-foreground" : "border-border",
            )}
            style={{ background: c }}
          />
        ))}
        <input
          type="color"
          aria-label={`${label} personalizada`}
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-full border border-border bg-transparent p-0"
        />
      </div>
    </Row>
  );
}

function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg border px-3 py-2 text-left text-[12.5px] font-medium transition-colors",
            value === o.value
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border hover:bg-secondary",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────── editores de listas ─────────────────────────── */

function FieldEditor({
  available,
  data,
  update,
}: {
  available: FieldKey[];
  data: BlockData;
  update: (patch: Partial<BlockData>) => void;
}) {
  const fields = data.fields ?? [];
  const required = data.required ?? [];
  const move = (i: number, dir: -1 | 1) => {
    const next = [...fields];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    update({ fields: next });
  };
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-[12px] text-muted-foreground">Ordem dos campos</Label>
        {fields.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-3 text-[12px] text-muted-foreground">
            Nenhum campo ativo neste bloco.
          </p>
        )}
        {fields.map((f, i) => (
          <div key={f} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5">
            <span className="flex-1 text-[12.5px] font-medium">{FIELD_LABELS[f]}</span>
            <button
              onClick={() =>
                update({ required: required.includes(f) ? required.filter((r) => r !== f) : [...required, f] })
              }
              className={cn(
                "rounded px-1.5 py-0.5 text-[10.5px] font-semibold transition-colors",
                required.includes(f) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {required.includes(f) ? "Obrigatório" : "Opcional"}
            </button>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Mover para cima" onClick={() => move(i, -1)}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Mover para baixo" onClick={() => move(i, 1)}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-border pt-3">
        <Label className="text-[12px] text-muted-foreground">Campos disponíveis</Label>
        {available.map((f) => (
          <ToggleRow
            key={f}
            label={FIELD_LABELS[f]}
            checked={fields.includes(f)}
            onChange={(v) =>
              update({
                fields: v ? [...fields, f] : fields.filter((x) => x !== f),
                required: v ? required : required.filter((x) => x !== f),
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function StepsEditor({ data, update }: { data: BlockData; update: (patch: Partial<BlockData>) => void }) {
  const steps = data.steps ?? [];
  const setSteps = (next: CheckoutStep[]) => update({ steps: next });
  const move = (i: number, dir: -1 | 1) => {
    const next = [...steps];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    setSteps(next);
  };
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={s.label}
            onChange={(e) => setSteps(steps.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))}
            className="h-7 flex-1 border-transparent bg-transparent px-1.5 text-[12.5px] hover:border-border focus-visible:border-border"
          />
          <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Subir" onClick={() => move(i, -1)}>
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Descer" onClick={() => move(i, 1)}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Remover etapa"
            disabled={steps.length <= 1}
            onClick={() => setSteps(steps.filter((x) => x.id !== s.id))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={steps.length >= 5}
        onClick={() => setSteps([...steps, { id: newId("step"), label: `Etapa ${steps.length + 1}` }])}
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar etapa
      </Button>
    </div>
  );
}

function TestimonialsEditor({ data, update }: { data: BlockData; update: (patch: Partial<BlockData>) => void }) {
  const items = data.testimonials ?? [];
  const setItems = (next: Testimonial[]) => update({ testimonials: next });
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    setItems(next);
  };
  return (
    <div className="space-y-3">
      {items.map((t, i) => (
        <div key={t.id} className="space-y-2 rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-1">
            <span className="flex-1 text-[11px] font-semibold text-muted-foreground">Depoimento {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Subir" onClick={() => move(i, -1)}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Descer" onClick={() => move(i, 1)}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Remover"
              onClick={() => setItems(items.filter((x) => x.id !== t.id))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input
            placeholder="Nome"
            value={t.name}
            onChange={(e) => setItems(items.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))}
            className="h-8 text-[12.5px]"
          />
          <Textarea
            rows={2}
            placeholder="Depoimento"
            value={t.text}
            onChange={(e) => setItems(items.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)))}
          />
          <Input
            placeholder="Foto/avatar (URL) — opcional"
            value={t.avatar ?? ""}
            onChange={(e) => setItems(items.map((x) => (x.id === t.id ? { ...x, avatar: e.target.value } : x)))}
            className="h-8 text-[12.5px]"
          />
          <Row label={`Estrelas — ${t.rating}`}>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[t.rating]}
              onValueChange={([v]) => setItems(items.map((x) => (x.id === t.id ? { ...x, rating: v! } : x)))}
            />
          </Row>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={items.length >= 4}
        onClick={() =>
          setItems([...items, { id: newId("tst"), name: "Novo cliente", text: "", rating: 5 }])
        }
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar depoimento
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Mantenha poucos depoimentos para não poluir o checkout.
      </p>
    </div>
  );
}

/* ─────────────────────────── inspetor por bloco ─────────────────────────── */

export function Inspector({
  block,
  update,
}: {
  block: Block;
  update: (patch: Partial<BlockData>) => void;
}) {
  const d = block.data;

  switch (block.type) {
    case "header":
      return (
        <div className="space-y-3">
          <Group title="Identidade" defaultOpen>
            <Row label="Tipo de identidade">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                {(["text", "logo"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => update({ identity: m })}
                    className={cn(
                      "rounded-md py-1.5 text-[12px] font-medium transition-colors",
                      (d.identity ?? "text") === m
                        ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m === "text" ? "Nome da loja" : "Logotipo"}
                  </button>
                ))}
              </div>
            </Row>
            {(d.identity ?? "text") === "text" ? (
              <>
                <Row label="Nome da loja/marca">
                  <Input
                    value={d.brandName ?? d.logo ?? ""}
                    onChange={(e) => update({ brandName: e.target.value })}
                  />
                </Row>
                <Row label="Tamanho">
                  <Select value={d.size ?? "md"} onValueChange={(size) => update({ size: size as NonNullable<BlockData["size"]> })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Pequeno</SelectItem>
                      <SelectItem value="md">Médio</SelectItem>
                      <SelectItem value="lg">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={`Peso da fonte — ${d.fontWeight ?? 700}`}>
                  <Slider
                    min={400}
                    max={800}
                    step={100}
                    value={[d.fontWeight ?? 700]}
                    onValueChange={([v]) => update({ fontWeight: v! })}
                  />
                </Row>
              </>
            ) : (
              <>
                <Row label="Logotipo (URL)" hint="Cole a URL da imagem do seu logotipo.">
                  <Input placeholder="https://..." value={d.logoUrl ?? ""} onChange={(e) => update({ logoUrl: e.target.value })} />
                </Row>
                {d.logoUrl && (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <img src={d.logoUrl || "/placeholder.svg"} alt="Logo" className="h-9 w-auto max-w-[120px] object-contain" />
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => update({ logoUrl: "" })}>
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </Button>
                  </div>
                )}
                <Row label={`Largura — ${d.logoWidth ?? 120}px`}>
                  <Slider min={60} max={220} step={10} value={[d.logoWidth ?? 120]} onValueChange={([v]) => update({ logoWidth: v! })} />
                </Row>
              </>
            )}
          </Group>

          <Group title="Pagamento seguro">
            <ToggleRow
              label="Mostrar selo de segurança"
              checked={!!d.secureEnabled}
              onChange={(v) => update({ secureEnabled: v })}
              hint="Indicação discreta de confiança perto da marca."
            />
            {d.secureEnabled && (
              <>
                <Row label="Texto">
                  <Input value={d.secureText ?? ""} onChange={(e) => update({ secureText: e.target.value })} />
                </Row>
                <Row label="Tamanho">
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                    {(["sm", "md"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => update({ secureSize: s })}
                        className={cn(
                          "rounded-md py-1.5 text-[12px] font-medium transition-colors",
                          (d.secureSize ?? "sm") === s
                            ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {s === "sm" ? "Pequeno" : "Médio"}
                      </button>
                    ))}
                  </div>
                </Row>
                <ColorRow label="Cor do ícone" value={d.secureColor} onChange={(secureColor) => update({ secureColor })} />
                <Row label="Alinhamento">
                  <AlignPicker value={d.secureAlign} onChange={(secureAlign) => update({ secureAlign })} />
                </Row>
              </>
            )}
          </Group>

          <Group title="Aparência">
            <Row label="Alinhamento da marca">
              <AlignPicker value={d.align} onChange={(align) => update({ align })} />
            </Row>
          </Group>
        </div>
      );

    case "divider":
      return (
        <div className="space-y-3">
          <Group title="Aparência" defaultOpen>
            <Row label={`Espessura — ${d.thickness ?? 1}px`}>
              <Slider min={1} max={6} step={1} value={[d.thickness ?? 1]} onValueChange={([v]) => update({ thickness: v! })} />
            </Row>
            <ColorRow label="Cor" value={d.color ?? "#0f172a"} onChange={(color) => update({ color })} />
            <Row label={`Opacidade — ${d.opacity ?? 10}%`}>
              <Slider min={4} max={100} step={2} value={[d.opacity ?? 10]} onValueChange={([v]) => update({ opacity: v! })} />
            </Row>
          </Group>
          <Group title="Espaçamento" defaultOpen>
            <Row label={`Espaço superior — ${d.spacingTop ?? 12}px`}>
              <Slider min={0} max={48} step={2} value={[d.spacingTop ?? 12]} onValueChange={([v]) => update({ spacingTop: v! })} />
            </Row>
            <Row label={`Espaço inferior — ${d.spacingBottom ?? 12}px`}>
              <Slider min={0} max={48} step={2} value={[d.spacingBottom ?? 12]} onValueChange={([v]) => update({ spacingBottom: v! })} />
            </Row>
          </Group>
        </div>
      );

    case "product":
      return (
        <div className="space-y-3">
          <Group title="Conteúdo" defaultOpen>
            <Row label="Nome do produto">
              <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
            </Row>
            <Row label="Descrição">
              <Textarea rows={3} value={d.description ?? ""} onChange={(e) => update({ description: e.target.value })} />
            </Row>
            <Row label="Imagem (URL)">
              <Input placeholder="https://..." value={d.image ?? ""} onChange={(e) => update({ image: e.target.value })} />
            </Row>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Preço (R$)">
                <Input type="number" value={d.price ?? 0} onChange={(e) => update({ price: Number(e.target.value) })} />
              </Row>
              <Row label="Preço comparativo">
                <Input type="number" value={d.compareAt ?? 0} onChange={(e) => update({ compareAt: Number(e.target.value) })} />
              </Row>
            </div>
          </Group>
          <Group title="Aparência">
            <ToggleRow label="Mostrar comparação" checked={!!d.showCompare} onChange={(v) => update({ showCompare: v })} />
            <ToggleRow label="Mostrar desconto" checked={!!d.showDiscount} onChange={(v) => update({ showDiscount: v })} />
            <ToggleRow label="Seletor de quantidade" checked={!!d.showQuantity} onChange={(v) => update({ showQuantity: v })} />
          </Group>
        </div>
      );

    case "customer":
      return (
        <Group title="Campos" defaultOpen>
          <FieldEditor available={CUSTOMER_FIELDS} data={d} update={update} />
        </Group>
      );

    case "address":
      return (
        <Group title="Campos" defaultOpen>
          <FieldEditor available={ADDRESS_FIELDS} data={d} update={update} />
        </Group>
      );

    case "steps":
      return (
        <div className="space-y-3">
          <Group title="Conteúdo" defaultOpen>
            <ToggleRow
              label="Checkout por etapas"
              checked={!!d.stepsEnabled}
              onChange={(v) => update({ stepsEnabled: v })}
              hint="Desligado = checkout único (tudo em uma página)."
            />
            {d.stepsEnabled && <StepsEditor data={d} update={update} />}
          </Group>
          {d.stepsEnabled && (
            <Group title="Aparência" defaultOpen>
              <Row label="Estilo">
                <Choice
                  value={d.stepsStyle ?? "progress"}
                  onChange={(stepsStyle) => update({ stepsStyle })}
                  options={[
                    { value: "minimal", label: "Minimalista" },
                    { value: "progress", label: "Linha de progresso" },
                    { value: "numbered", label: "Etapas numeradas" },
                  ]}
                />
              </Row>
              <ToggleRow label="Mostrar números" checked={!!d.showNumbers} onChange={(v) => update({ showNumbers: v })} />
              <ToggleRow label="Mostrar ícones" checked={!!d.showStepIcons} onChange={(v) => update({ showStepIcons: v })} />
            </Group>
          )}
        </div>
      );

    case "payment":
      return (
        <div className="space-y-3">
          <Group title="Métodos de pagamento" defaultOpen>
            <ToggleRow label="PIX — pagamento imediato" checked={!!d.pix} onChange={(v) => update({ pix: v })} />
            <ToggleRow label="Cartão de crédito" checked={!!d.card} onChange={(v) => update({ card: v })} />
            <ToggleRow label="Boleto" checked={!!d.boleto} onChange={(v) => update({ boleto: v })} />
            <p className="text-[11.5px] text-muted-foreground">
              Apenas os métodos ativos aparecem no checkout. O processamento real é conectado pelo DEV depois.
            </p>
          </Group>
        </div>
      );

    case "summary":
      return (
        <div className="space-y-3">
          <Group title="Conteúdo" defaultOpen>
            <Row label="Texto do botão">
              <Input value={d.buttonLabel ?? ""} onChange={(e) => update({ buttonLabel: e.target.value })} />
            </Row>
            <ToggleRow label="Ícone de cadeado" checked={!!d.buttonIcon} onChange={(v) => update({ buttonIcon: v })} />
          </Group>
          <Group title="Aparência" defaultOpen>
            <ColorRow label="Cor do botão" value={d.buttonColor ?? "#2563eb"} onChange={(buttonColor) => update({ buttonColor })} />
            <Row label={`Altura — ${d.buttonHeight ?? 52}px`}>
              <Slider min={40} max={64} step={2} value={[d.buttonHeight ?? 52]} onValueChange={([v]) => update({ buttonHeight: v! })} />
            </Row>
            <Row label={`Arredondamento — ${d.buttonRadius ?? 12}px`}>
              <Slider min={0} max={28} step={2} value={[d.buttonRadius ?? 12]} onValueChange={([v]) => update({ buttonRadius: v! })} />
            </Row>
            <ToggleRow label="Largura total" checked={!!d.buttonFull} onChange={(v) => update({ buttonFull: v })} />
            {!d.buttonFull && (
              <Row label="Alinhamento">
                <AlignPicker value={d.align} onChange={(align) => update({ align })} />
              </Row>
            )}
          </Group>
        </div>
      );

    case "bump":
      return (
        <div className="space-y-3">
          <Group title="Conteúdo" defaultOpen>
            <ToggleRow label="Order bump ativo" checked={!!d.enabled} onChange={(v) => update({ enabled: v })} />
            <Row label="Título">
              <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
            </Row>
            <Row label="Descrição">
              <Textarea rows={2} value={d.description ?? ""} onChange={(e) => update({ description: e.target.value })} />
            </Row>
            <Row label="Preço (R$)">
              <Input type="number" value={d.price ?? 0} onChange={(e) => update({ price: Number(e.target.value) })} />
            </Row>
            <Row label="Imagem (URL)">
              <Input placeholder="https://..." value={d.image ?? ""} onChange={(e) => update({ image: e.target.value })} />
            </Row>
          </Group>
        </div>
      );

    case "upsell":
      return (
        <Group title="Conteúdo" defaultOpen>
          <ToggleRow label="Upsell pós-compra" checked={!!d.enabled} onChange={(v) => update({ enabled: v })} />
          <Row label="Título">
            <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
          </Row>
        </Group>
      );

    case "social":
      return (
        <div className="space-y-3">
          <Group title="Aparência" defaultOpen>
            <Row label="Estilo">
              <Choice
                value={d.socialStyle ?? "card"}
                onChange={(socialStyle) => update({ socialStyle })}
                options={[
                  { value: "simple", label: "Depoimento simples" },
                  { value: "card", label: "Card de avaliação" },
                  { value: "stacked", label: "Depoimentos empilhados" },
                  { value: "rating", label: "Avaliação + estrelas" },
                ]}
              />
            </Row>
          </Group>
          <Group title="Conteúdo" defaultOpen>
            <TestimonialsEditor data={d} update={update} />
          </Group>
        </div>
      );

    case "live":
      return (
        <div className="space-y-3">
          <Group title="Conteúdo" defaultOpen>
            <p className="rounded-lg border border-dashed border-border bg-secondary/50 p-2.5 text-[11.5px] text-muted-foreground">
              Estado de demonstração. Na versão publicada, o DEV conectará eventos reais de compras.
            </p>
            <Row label="Nome exibido">
              <Input value={d.liveName ?? ""} onChange={(e) => update({ liveName: e.target.value })} />
            </Row>
            <Row label="Produto">
              <Input value={d.liveProduct ?? ""} onChange={(e) => update({ liveProduct: e.target.value })} />
            </Row>
            <Row label="Frase">
              <Select
                value={d.livePhrase && LIVE_PHRASES.includes(d.livePhrase) ? d.livePhrase : "custom"}
                onValueChange={(v) => update({ livePhrase: v === "custom" ? d.livePhrase ?? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIVE_PHRASES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Frase personalizada</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            {!LIVE_PHRASES.includes(d.livePhrase ?? "") && (
              <Row label="Frase personalizada">
                <Input value={d.livePhrase ?? ""} onChange={(e) => update({ livePhrase: e.target.value })} />
              </Row>
            )}
            <Row label="Localização (opcional)">
              <Input value={d.liveLocation ?? ""} onChange={(e) => update({ liveLocation: e.target.value })} />
            </Row>
          </Group>
          <Group title="Aparência">
            <ToggleRow label="Mostrar avatar" checked={!!d.liveShowAvatar} onChange={(v) => update({ liveShowAvatar: v })} />
            <ToggleRow label="Mostrar produto" checked={!!d.liveShowProduct} onChange={(v) => update({ liveShowProduct: v })} />
            <ToggleRow label="Mostrar localização" checked={!!d.liveShowLocation} onChange={(v) => update({ liveShowLocation: v })} />
            <Row label="Posição">
              <Select value={d.livePosition ?? "bottom-left"} onValueChange={(v) => update({ livePosition: v as NonNullable<BlockData["livePosition"]> })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-left">Inferior esquerdo</SelectItem>
                  <SelectItem value="bottom-right">Inferior direito</SelectItem>
                  <SelectItem value="top-left">Superior esquerdo</SelectItem>
                  <SelectItem value="top-right">Superior direito</SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </Group>
          <Group title="Comportamento">
            <Row label={`Duração — ${d.liveDuration ?? 5}s`}>
              <Slider min={2} max={12} step={1} value={[d.liveDuration ?? 5]} onValueChange={([v]) => update({ liveDuration: v! })} />
            </Row>
            <Row label={`Intervalo — ${d.liveInterval ?? 8}s`}>
              <Slider min={4} max={30} step={1} value={[d.liveInterval ?? 8]} onValueChange={([v]) => update({ liveInterval: v! })} />
            </Row>
            <p className="text-[11px] text-muted-foreground">
              No mobile, a posição se adapta para não cobrir campos ou o botão de compra.
            </p>
          </Group>
        </div>
      );

    case "guarantee":
      return (
        <Group title="Conteúdo" defaultOpen>
          <Row label="Título">
            <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
          </Row>
          <Row label="Descrição">
            <Textarea rows={3} value={d.description ?? ""} onChange={(e) => update({ description: e.target.value })} />
          </Row>
        </Group>
      );

    case "security":
      return (
        <div className="space-y-3">
          <Group title="Aparência" defaultOpen>
            <Row label="Estilo">
              <Choice
                value={d.securityStyle ?? "badges"}
                onChange={(securityStyle) => update({ securityStyle })}
                options={[
                  { value: "badges", label: "Selos em destaque" },
                  { value: "inline", label: "Linha discreta" },
                ]}
              />
            </Row>
            <ColorRow label="Cor" value={d.securityColor} onChange={(securityColor) => update({ securityColor })} />
            <Row label="Tamanho">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                {(["sm", "md"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => update({ securitySize: s })}
                    className={cn(
                      "rounded-md py-1.5 text-[12px] font-medium transition-colors",
                      (d.securitySize ?? "sm") === s
                        ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s === "sm" ? "Pequeno" : "Médio"}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Alinhamento">
              <AlignPicker value={d.securityAlign} onChange={(securityAlign) => update({ securityAlign })} />
            </Row>
          </Group>
          <Group title="Conteúdo" defaultOpen>
            <Row label="Itens" hint="Separe os selos por “·”. Ex: Compra protegida · Pagamento seguro">
              <Textarea rows={2} value={d.text ?? ""} onChange={(e) => update({ text: e.target.value })} />
            </Row>
          </Group>
        </div>
      );

    case "offer":
    case "coupon":
    case "countdown":
    case "footer":
    default:
      return (
        <Group title="Conteúdo" defaultOpen>
          <Row label="Título">
            <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
          </Row>
          <Row label="Texto">
            <Textarea
              rows={3}
              value={d.text ?? d.description ?? ""}
              onChange={(e) => update(d.text !== undefined ? { text: e.target.value } : { description: e.target.value })}
            />
          </Row>
        </Group>
      );
  }
}

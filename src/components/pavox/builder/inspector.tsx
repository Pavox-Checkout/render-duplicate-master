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
  type Block,
  type BlockData,
  type FieldKey,
} from "@/lib/checkout-builder";
import { ChevronDown, ChevronUp } from "lucide-react";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-[13px] font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function AlignPicker({
  value,
  onChange,
}: {
  value: BlockData["align"];
  onChange: (v: "left" | "center" | "right") => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
      {(["left", "center", "right"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md py-1.5 text-[12px] font-medium capitalize transition-colors",
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
          <div
            key={f}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5"
          >
            <span className="flex-1 text-[12.5px] font-medium">{FIELD_LABELS[f]}</span>
            <button
              onClick={() => update({ required: required.includes(f) ? required.filter((r) => r !== f) : [...required, f] })}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10.5px] font-semibold transition-colors",
                required.includes(f)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary",
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
        <div className="space-y-4">
          <Row label="Logo (texto)">
            <Input value={d.logo ?? ""} onChange={(e) => update({ logo: e.target.value })} />
          </Row>
          <Row label="Alinhamento">
            <AlignPicker value={d.align} onChange={(align) => update({ align })} />
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
        </div>
      );

    case "product":
      return (
        <div className="space-y-4">
          <Row label="Nome do produto">
            <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
          </Row>
          <Row label="Descrição">
            <Textarea
              rows={3}
              value={d.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Preço (R$)">
              <Input
                type="number"
                value={d.price ?? 0}
                onChange={(e) => update({ price: Number(e.target.value) })}
              />
            </Row>
            <Row label="Preço comparativo">
              <Input
                type="number"
                value={d.compareAt ?? 0}
                onChange={(e) => update({ compareAt: Number(e.target.value) })}
              />
            </Row>
          </div>
          <ToggleRow label="Mostrar comparação" checked={!!d.showCompare} onChange={(v) => update({ showCompare: v })} />
          <ToggleRow label="Mostrar desconto" checked={!!d.showDiscount} onChange={(v) => update({ showDiscount: v })} />
          <ToggleRow label="Seletor de quantidade" checked={!!d.showQuantity} onChange={(v) => update({ showQuantity: v })} />
        </div>
      );

    case "customer":
      return <FieldEditor available={CUSTOMER_FIELDS} data={d} update={update} />;

    case "address":
      return <FieldEditor available={ADDRESS_FIELDS} data={d} update={update} />;

    case "payment":
      return (
        <div className="space-y-3">
          <ToggleRow label="Mostrar Pix" checked={!!d.pix} onChange={(v) => update({ pix: v })} />
          <ToggleRow label="Mostrar cartão" checked={!!d.card} onChange={(v) => update({ card: v })} />
          <ToggleRow label="Mostrar boleto" checked={!!d.boleto} onChange={(v) => update({ boleto: v })} />
          <p className="text-[12px] text-muted-foreground">
            O processamento real acontece após conectar um gateway em Integrações.
          </p>
        </div>
      );

    case "summary":
      return (
        <div className="space-y-4">
          <Row label="Texto do botão">
            <Input value={d.buttonLabel ?? ""} onChange={(e) => update({ buttonLabel: e.target.value })} />
          </Row>
          <Row label={`Altura do botão — ${d.buttonHeight ?? 48}px`}>
            <Slider
              min={40}
              max={64}
              step={2}
              value={[d.buttonHeight ?? 48]}
              onValueChange={([v]) => update({ buttonHeight: v! })}
            />
          </Row>
          <ToggleRow label="Largura total" checked={!!d.buttonFull} onChange={(v) => update({ buttonFull: v })} />
          {!d.buttonFull && (
            <Row label="Alinhamento">
              <AlignPicker value={d.align} onChange={(align) => update({ align })} />
            </Row>
          )}
        </div>
      );

    case "bump":
      return (
        <div className="space-y-4">
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
            <Input
              placeholder="https://..."
              value={d.image ?? ""}
              onChange={(e) => update({ image: e.target.value })}
            />
          </Row>
        </div>
      );

    case "upsell":
      return (
        <div className="space-y-4">
          <ToggleRow label="Upsell pós-compra" checked={!!d.enabled} onChange={(v) => update({ enabled: v })} />
          <Row label="Título">
            <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
          </Row>
        </div>
      );

    case "social":
      return (
        <div className="space-y-4">
          <Row label="Depoimento">
            <Textarea rows={3} value={d.text ?? ""} onChange={(e) => update({ text: e.target.value })} />
          </Row>
          <Row label="Nome">
            <Input value={d.author ?? ""} onChange={(e) => update({ author: e.target.value })} />
          </Row>
          <Row label={`Avaliação — ${d.rating ?? 5} estrelas`}>
            <Slider min={1} max={5} step={1} value={[d.rating ?? 5]} onValueChange={([v]) => update({ rating: v! })} />
          </Row>
        </div>
      );

    case "guarantee":
      return (
        <div className="space-y-4">
          <Row label="Título">
            <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
          </Row>
          <Row label="Descrição">
            <Textarea rows={3} value={d.description ?? ""} onChange={(e) => update({ description: e.target.value })} />
          </Row>
        </div>
      );

    case "countdown":
      return (
        <div className="space-y-4">
          <Row label="Chamada">
            <Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
          </Row>
          <Row label="Tempo exibido">
            <Input value={d.text ?? ""} onChange={(e) => update({ text: e.target.value })} />
          </Row>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
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
        </div>
      );
  }
}

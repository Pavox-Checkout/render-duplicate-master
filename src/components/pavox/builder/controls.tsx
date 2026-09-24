import { useRef, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight, ImagePlus, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Align } from "@/lib/checkout-builder";
import { cn } from "@/lib/utils";

/** Título de um grupo de controles dentro de uma seção. */
export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      {title ? (
        <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">{title}</p>
      ) : null}
      {children}
    </div>
  );
}

/** Linha com rótulo à esquerda e controle à direita. */
export function Row({
  label,
  hint,
  htmlFor,
  children,
  stacked,
}: {
  label: string;
  hint?: string | undefined;
  htmlFor?: string | undefined;
  children: ReactNode;
  stacked?: boolean | undefined;
}) {
  if (stacked) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={htmlFor} className="text-[12.5px] font-medium">
          {label}
        </Label>
        {hint ? <p className="text-[11.5px] leading-snug text-muted-foreground">{hint}</p> : null}
        {children}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="text-[12.5px] font-medium">
          {label}
        </Label>
        {hint ? <p className="text-[11.5px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label} hint={hint}>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Row>
  );
}

export function TextField({
  label,
  hint,
  value,
  placeholder,
  onChange,
  textarea,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <Row label={label} hint={hint} stacked>
      {textarea ? (
        <Textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[64px] resize-none text-[13px]"
        />
      ) : (
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 text-[13px]"
        />
      )}
    </Row>
  );
}

export function NumberField({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={label} hint={hint}>
      <div className="relative w-[104px]">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 pr-9 text-[13px]"
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[11px] text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </Row>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[12.5px] font-medium">{label}</Label>
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}

export function SelectRow<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Row label={label} hint={hint} stacked>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="h-9 text-[13px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-[13px]">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
}

/** Grupo de botões exclusivos (segmented control). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  columns,
}: {
  label?: string;
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="space-y-1.5">
      {label ? <Label className="text-[12.5px] font-medium">{label}</Label> : null}
      <div
        className="grid gap-1 rounded-lg bg-secondary p-1"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors",
              value === o.value
                ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AlignField({ label, value, onChange }: { label?: string; value: Align; onChange: (v: Align) => void }) {
  return (
    <Segmented<Align>
      label={label ?? "Alinhamento"}
      value={value}
      onChange={onChange}
      options={[
        { value: "left", label: <AlignLeft className="h-3.5 w-3.5" />, title: "Esquerda" },
        { value: "center", label: <AlignCenter className="h-3.5 w-3.5" />, title: "Centro" },
        { value: "right", label: <AlignRight className="h-3.5 w-3.5" />, title: "Direita" },
      ]}
    />
  );
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Controle de cor profissional: swatch + color picker + campo HEX editável. */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const safe = HEX_RE.test(value) ? value : "#000000";
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-[12.5px] font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <label
          className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border shadow-inner"
          style={{ background: safe }}
          title="Escolher cor"
        >
          <input
            type="color"
            value={safe}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 h-10 w-10 cursor-pointer opacity-0"
            aria-label={`Cor ${label}`}
          />
        </label>
        <div className="relative w-[104px]">
          <Input
            value={value}
            onChange={(e) => {
              const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
              onChange(v);
            }}
            spellCheck={false}
            className="h-9 pr-7 text-[12.5px] font-mono uppercase"
          />
          <Pencil className="pointer-events-none absolute inset-y-0 right-2.5 my-auto h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

/** Upload de imagem com preview (mock: usa data URL local). */
export function ImageUpload({
  label,
  hint,
  value,
  onChange,
  aspect,
}: {
  label: string;
  hint?: string | undefined;
  value?: string | undefined;
  onChange: (v: string | undefined) => void;
  aspect?: string | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();
  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px] font-medium">{label}</Label>
      {hint ? <p className="text-[11.5px] leading-snug text-muted-foreground">{hint}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="space-y-2">
          <div
            className="flex items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/50"
            style={{ aspectRatio: aspect ?? "16 / 6" }}
          >
            <img src={value || "/placeholder.svg"} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={pick}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-[12px] font-medium transition-colors hover:bg-secondary"
            >
              <ImagePlus className="h-3.5 w-3.5" /> Trocar
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="flex items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-5 text-center transition-colors hover:border-primary/40 hover:bg-secondary"
        >
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-[12.5px] font-medium">Enviar imagem</span>
          <span className="text-[11px] text-muted-foreground">PNG, JPG ou SVG</span>
        </button>
      )}
    </div>
  );
}

/** Cartões de rádio (escolha exclusiva com descrição). */
export function RadioCards<T extends string>({
  value,
  options,
  onChange,
  columns,
}: {
  value: T;
  options: { value: T; label: string; hint?: string; icon?: LucideIcon }[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns ?? 1}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
              active ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/60",
            )}
          >
            {Icon ? (
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold">{o.label}</span>
              {o.hint ? <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">{o.hint}</span> : null}
            </span>
            <span
              className={cn(
                "ml-auto mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                active ? "border-primary" : "border-border",
              )}
            >
              {active ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

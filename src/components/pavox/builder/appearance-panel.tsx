import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PRESETS, type Appearance } from "@/lib/checkout-builder";

const SWATCHES = ["#2563eb", "#0f172a", "#16a34a", "#db2777", "#f59e0b", "#7c3aed"];
const BACKGROUNDS = ["#f6f7f9", "#ffffff", "#eef2ff", "#0f172a", "#111827"];

function ColorRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((c) => (
          <button
            key={c}
            aria-label={`${label} ${c}`}
            onClick={() => onChange(c)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
              value.toLowerCase() === c ? "border-foreground" : "border-border",
            )}
            style={{ background: c }}
          />
        ))}
        <input
          type="color"
          aria-label={`${label} personalizada`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-full border border-border bg-transparent p-0"
        />
      </div>
    </div>
  );
}

export function AppearancePanel({
  appearance,
  onChange,
}: {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-[12px] text-muted-foreground">Presets</Label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PRESETS) as Appearance["preset"][]).map((p) => (
            <button
              key={p}
              onClick={() => onChange({ preset: p, ...PRESETS[p] })}
              className={cn(
                "rounded-lg border p-2 text-center transition-colors",
                appearance.preset === p
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border hover:bg-secondary",
              )}
            >
              <span
                className="mx-auto mb-1.5 block h-6 w-full rounded"
                style={{
                  background: PRESETS[p].background,
                  borderBottom: `3px solid ${PRESETS[p].button}`,
                }}
              />
              <span className="text-[11.5px] font-medium capitalize">
                {p === "padrao" ? "Padrão" : p}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ColorRow
        label="Cor principal"
        value={appearance.primary}
        options={SWATCHES}
        onChange={(primary) => onChange({ primary })}
      />
      <ColorRow
        label="Cor do botão"
        value={appearance.button}
        options={SWATCHES}
        onChange={(button) => onChange({ button })}
      />
      <ColorRow
        label="Cor de fundo"
        value={appearance.background}
        options={BACKGROUNDS}
        onChange={(background) => onChange({ background })}
      />

      <div className="space-y-1.5">
        <Label className="text-[12px] text-muted-foreground">Fonte</Label>
        <Select value={appearance.font} onValueChange={(font) => onChange({ font: font as Appearance["font"] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sans">Manrope (moderna)</SelectItem>
            <SelectItem value="display">Sora (destaque)</SelectItem>
            <SelectItem value="serif">Serifada (clássica)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-muted-foreground">
          Arredondamento — {appearance.radius}px
        </Label>
        <Slider
          min={0}
          max={24}
          step={2}
          value={[appearance.radius]}
          onValueChange={([radius]) => onChange({ radius })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-muted-foreground">
          Largura do checkout — {appearance.width}px
        </Label>
        <Slider
          min={420}
          max={720}
          step={20}
          value={[appearance.width]}
          onValueChange={([width]) => onChange({ width })}
        />
      </div>
    </div>
  );
}

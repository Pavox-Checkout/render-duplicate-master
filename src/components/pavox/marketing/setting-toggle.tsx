import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Linha de configuração com toggle Ativo/Inativo — usada nas telas de
 * configurações avançadas e listas de opções de marketing.
 */
export function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/30",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[12px] text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

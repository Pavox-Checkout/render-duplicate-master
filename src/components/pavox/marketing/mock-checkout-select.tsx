import { Link2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_CHECKOUTS } from "@/lib/marketing-data";
import { cn } from "@/lib/utils";

/**
 * Seletor de checkout (mock). Preparado para o DEV trocar por dados reais
 * (ex.: hook useCheckouts) mantendo a mesma API de props.
 */
export function MockCheckoutSelect({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  id?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn("h-9", className)}>
        <span className="flex items-center gap-1.5 truncate">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Selecionar checkout" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {MOCK_CHECKOUTS.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

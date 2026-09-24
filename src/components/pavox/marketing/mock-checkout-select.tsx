import { Link } from "@tanstack/react-router";
import { AlertCircle, Link2, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCheckouts } from "@/hooks/useCheckouts";
import { cn } from "@/lib/utils";

/**
 * Seletor de checkout das ferramentas de Marketing.
 *
 * Usa os checkouts REAIS da conta (hook `useCheckouts`) e trata os 4 estados:
 * carregando, erro (com "tentar novamente"), sem checkouts (estado vazio + CTA)
 * e com checkouts. A opção "Todos os checkouts" só aparece quando existe ao
 * menos um checkout real. Nenhum checkout fictício é exibido.
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
  const { checkouts, isLoading, error, refetch } = useCheckouts();

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 text-[12.5px] text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando checkouts…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-[12.5px] text-destructive">
        <span className="flex min-w-0 items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Falha ao carregar checkouts</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-destructive hover:text-destructive"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (checkouts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-secondary/30 px-3 py-3 text-center">
        <p className="text-[12.5px] font-medium">Nenhum checkout criado</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Crie seu primeiro checkout para aplicar esta ferramenta.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-2.5">
          <Link to="/checkouts/novo">
            <Plus className="h-3.5 w-3.5" /> Criar checkout
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn("h-9", className)}>
        <span className="flex items-center gap-1.5 truncate">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Selecionar checkout" />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os checkouts</SelectItem>
        {checkouts.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
 * Seletor de "Checkout associado" preparado para dados reais.
 *
 * Trata os 4 estados vindos de `useCheckouts`:
 * 1. Carregando   → indicador de loading
 * 2. Erro         → mensagem + botão "Tentar novamente" (refetch)
 * 3. Sem checkouts→ estado vazio + botão "Criar checkout" (→ /checkouts/novo)
 * 4. Com checkouts→ lista/select (nome + produto associado quando disponível)
 *
 * Nenhum checkout fictício é criado aqui.
 */
export function CheckoutSelect({
  value,
  onChange,
  triggerClassName,
  id,
}: {
  value: string | null;
  onChange: (checkoutId: string) => void;
  triggerClassName?: string;
  id?: string;
}) {
  const { checkouts, isLoading, error, refetch } = useCheckouts();

  // 3. Carregando
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 text-[12.5px] text-muted-foreground",
          triggerClassName,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando checkouts…
      </div>
    );
  }

  // 4. Erro
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

  // 2. Sem checkouts
  if (checkouts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-secondary/30 px-3 py-3 text-center">
        <p className="text-[12.5px] font-medium">Nenhum checkout encontrado</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Para associar um domínio, primeiro crie um checkout.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-2.5">
          <Link to="/checkouts/novo">
            <Plus className="h-3.5 w-3.5" /> Criar checkout
          </Link>
        </Button>
      </div>
    );
  }

  // 1. Com checkouts
  return (
    <Select {...(value ? { value } : {})} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn("h-9", triggerClassName)}>
        <span className="flex items-center gap-1.5 truncate">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Selecionar checkout" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {checkouts.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="truncate">{c.name}</span>
            {c.product ? <span className="text-muted-foreground"> · {c.product}</span> : null}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

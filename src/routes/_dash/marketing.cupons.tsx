import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Loader2, MoreHorizontal, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";
import {
  couponStatus,
  normalizeCode,
  useCoupons,
  useDeleteCoupon,
  useSaveCoupon,
  type CouponInput,
  type CouponRow,
} from "@/lib/coupons";

export const Route = createFileRoute("/_dash/marketing/cupons")({
  component: CuponsPage,
  head: () => ({
    meta: [
      { title: "Cupons · PAVOX" },
      { name: "description", content: "Crie e gerencie cupons de desconto para seus checkouts." },
    ],
  }),
});

const describe = (c: CouponRow) =>
  c.type === "percent"
    ? `${c.value.toLocaleString("pt-BR")}% de desconto`
    : `${brl(c.value)} de desconto`;

function CuponsPage() {
  const { data: coupons = [], isLoading, isError, refetch } = useCoupons();
  const [editing, setEditing] = useState<CouponRow | "new" | null>(null);
  const save = useSaveCoupon();
  const remove = useDeleteCoupon();

  const toggle = (c: CouponRow) =>
    save.mutate(
      {
        id: c.id,
        input: {
          code: c.code,
          type: c.type,
          value: c.value,
          minimum_amount: c.minimum_amount,
          max_uses: c.max_uses,
          expires_at: c.expires_at,
          active: !c.active,
        },
      },
      {
        onSuccess: () =>
          toast.success(c.active ? `Cupom ${c.code} pausado` : `Cupom ${c.code} ativado`),
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <>
      <PageHeader
        title="Cupons"
        subtitle="Códigos de desconto que o comprador digita no checkout. Valem em todos os seus checkouts publicados."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Novo cupom
          </Button>
        }
      />

      {isError ? (
        <div className="rounded-xl border border-destructive/30 px-4 py-3 text-[15px] text-destructive">
          Não foi possível carregar seus cupons.{" "}
          <button type="button" className="font-semibold underline" onClick={() => void refetch()}>
            Tentar de novo
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Nenhum cupom criado"
          description="Crie um cupom e divulgue o código. O campo de cupom aparece no checkout assim que houver um cupom ativo."
          action={
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> Novo cupom
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {coupons.map((c) => {
            const st = couponStatus(c);
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[15px] font-bold tracking-wide">{c.code}</span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[12.5px] font-semibold",
                        st.tone === "ok" && "bg-success/10 text-success",
                        st.tone === "warn" && "bg-warning/15 text-foreground",
                        st.tone === "off" && "bg-secondary text-muted-foreground",
                      )}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[14px] text-muted-foreground">
                    {describe(c)}
                    {c.minimum_amount > 0
                      ? `, em compras a partir de ${brl(c.minimum_amount)}`
                      : ""}
                    {c.expires_at
                      ? `, até ${new Date(c.expires_at).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </div>
                <div className="text-right text-[14px] tabular-nums">
                  <b>{c.uses}</b>
                  <span className="text-muted-foreground">
                    {c.max_uses != null ? ` de ${c.max_uses}` : ""} {c.uses === 1 ? "uso" : "usos"}
                  </span>
                </div>
                <Switch
                  checked={c.active}
                  onCheckedChange={() => toggle(c)}
                  aria-label={c.active ? `Pausar ${c.code}` : `Ativar ${c.code}`}
                  disabled={save.isPending}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10"
                      aria-label={`Opções de ${c.code}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        navigator.clipboard?.writeText(c.code).then(
                          () => toast.success(`Código ${c.code} copiado`),
                          () => toast.error("Não deu para copiar. Selecione o código e copie."),
                        )
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copiar código
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditing(c)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Excluir o cupom ${c.code}? Pedidos antigos continuam com o desconto registrado.`,
                          )
                        )
                          return;
                        remove.mutate(c.id, {
                          onSuccess: () => toast.success(`Cupom ${c.code} excluído`),
                          onError: (e) => toast.error(e.message),
                        });
                      }}
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <CouponDialog
          coupon={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function CouponDialog({ coupon, onClose }: { coupon: CouponRow | null; onClose: () => void }) {
  const save = useSaveCoupon();
  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<"percent" | "fixed">(coupon?.type ?? "percent");
  const [value, setValue] = useState(coupon ? String(coupon.value).replace(".", ",") : "");
  const [minimum, setMinimum] = useState(
    coupon && coupon.minimum_amount > 0 ? String(coupon.minimum_amount).replace(".", ",") : "",
  );
  const [maxUses, setMaxUses] = useState(coupon?.max_uses != null ? String(coupon.max_uses) : "");
  const [expires, setExpires] = useState(coupon?.expires_at ? coupon.expires_at.slice(0, 10) : "");
  const [error, setError] = useState<string | null>(null);

  const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const c = normalizeCode(code);
    const v = num(value);
    const min = minimum.trim() ? num(minimum) : 0;
    const max = maxUses.trim() ? Number(maxUses) : null;
    if (c.length < 3) return setError("O código precisa ter pelo menos 3 letras ou números.");
    if (!Number.isFinite(v) || v <= 0) return setError("Informe o valor do desconto.");
    if (type === "percent" && v > 100) return setError("O percentual vai até 100%.");
    if (!Number.isFinite(min) || min < 0) return setError("Valor mínimo inválido.");
    if (max != null && (!Number.isInteger(max) || max < 1))
      return setError("Limite de usos inválido.");
    const input: CouponInput = {
      code: c,
      type,
      value: Math.round(v * 100) / 100,
      minimum_amount: Math.round(min * 100) / 100,
      max_uses: max,
      // Vale até o fim do dia escolhido, no horário de Brasília.
      expires_at: expires ? new Date(`${expires}T23:59:59-03:00`).toISOString() : null,
      active: coupon?.active ?? true,
    };
    save.mutate(
      { ...(coupon ? { id: coupon.id } : {}), input },
      {
        onSuccess: () => {
          toast.success(coupon ? `Cupom ${c} salvo` : `Cupom ${c} criado`);
          onClose();
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{coupon ? `Editar ${coupon.code}` : "Novo cupom"}</DialogTitle>
          <DialogDescription>
            O desconto é calculado no servidor na hora da compra. O total nunca fica abaixo de R$
            1,00.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cp-code">Código</Label>
            <Input
              id="cp-code"
              value={code}
              onChange={(e) => setCode(normalizeCode(e.target.value))}
              placeholder="BEMVINDO10"
              className="font-mono uppercase"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cp-type">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as "percent" | "fixed")}>
                <SelectTrigger id="cp-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cp-value">
                {type === "percent" ? "Desconto (%)" : "Desconto (R$)"}
              </Label>
              <Input
                id="cp-value"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "percent" ? "10" : "20,00"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cp-min">Compra mínima (opcional)</Label>
              <Input
                id="cp-min"
                inputMode="decimal"
                value={minimum}
                onChange={(e) => setMinimum(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cp-max">Limite de usos (opcional)</Label>
              <Input
                id="cp-max"
                inputMode="numeric"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ""))}
                placeholder="Sem limite"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cp-exp">Válido até (opcional)</Label>
            <Input
              id="cp-exp"
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-[14px] font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {coupon ? "Salvar cupom" : "Criar cupom"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

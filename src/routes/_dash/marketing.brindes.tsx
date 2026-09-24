import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Gift } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { ToolStatusBadge } from "@/components/pavox/marketing/tool-status-badge";
import { MockCheckoutSelect } from "@/components/pavox/marketing/mock-checkout-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GIFTS } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/brindes")({
  component: BrindesPage,
  head: () => ({
    meta: [
      { title: "Brindes · PAVOX" },
      {
        name: "description",
        content: "Ofereça brindes automáticos por valor de compra e aumente o ticket médio.",
      },
    ],
  }),
});

function BrindesPage() {
  const [open, setOpen] = useState(false);
  const [checkout, setCheckout] = useState("all");
  const gifts = GIFTS;

  return (
    <>
      <PageHeader
        title="Brindes"
        subtitle="Presenteie clientes automaticamente ao atingir um valor mínimo de compra."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo brinde
          </Button>
        }
      />

      {gifts.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nenhum brinde configurado"
          description="Crie uma regra de brinde para recompensar compras acima de um valor e incentivar pedidos maiores."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Novo brinde
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((g) => (
            <div key={g.id} className="surface flex flex-col p-4">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Gift className="h-5 w-5" />
                </span>
                <ToolStatusBadge status={g.status} />
              </div>
              <h3 className="mt-3 text-[14.5px] font-semibold">{g.reward}</h3>
              <p className="mt-1 text-[12.5px] text-muted-foreground">{g.condition}</p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-[12px] text-muted-foreground">Valor mínimo</span>
                <span className="text-[13px] font-semibold tabular-nums">{g.minValue}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Aplicado em</span>
                <span className="text-[12.5px] font-medium">{g.checkout}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo brinde</DialogTitle>
            <DialogDescription>
              Defina o brinde e o valor mínimo de compra para liberá-lo automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="gift-name">Nome do brinde</Label>
              <Input id="gift-name" placeholder="Ex.: E-book exclusivo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gift-min">Valor mínimo de compra</Label>
              <Input id="gift-min" placeholder="R$ 200,00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gift-checkout">Aplicar em</Label>
              <MockCheckoutSelect id="gift-checkout" value={checkout} onChange={setCheckout} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.success("Brinde criado com sucesso.");
                setOpen(false);
              }}
            >
              Criar brinde
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

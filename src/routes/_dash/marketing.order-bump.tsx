import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { ToolStatusBadge } from "@/components/pavox/marketing/tool-status-badge";
import { CheckoutPreviewFrame } from "@/components/pavox/marketing/checkout-preview-frame";
import { Button } from "@/components/ui/button";
import { ORDER_BUMPS } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/order-bump")({
  component: OrderBumpPage,
  head: () => ({
    meta: [
      { title: "Order Bump · PAVOX" },
      {
        name: "description",
        content: "Ofereça produtos complementares na finalização da compra e aumente o ticket médio.",
      },
    ],
  }),
});

function OrderBumpPage() {
  const bumps = ORDER_BUMPS;
  const [checked, setChecked] = useState(false);

  return (
    <>
      <PageHeader
        title="Order Bump"
        subtitle="Ofertas complementares exibidas dentro do checkout, com um clique para adicionar ao pedido."
        actions={
          <Button size="sm" onClick={() => toast.info("Criar order bump")}>
            <Plus className="h-4 w-4" /> Novo order bump
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="space-y-3">
          {bumps.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Nenhum order bump configurado"
              description="Crie uma oferta complementar para aumentar o valor médio dos seus pedidos."
            />
          ) : (
            bumps.map((b) => (
              <div key={b.id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[14px] font-semibold">{b.offer}</h3>
                    <ToolStatusBadge status={b.status} />
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    Produto principal: {b.mainProduct} · {b.checkout}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Conversão</p>
                    <p className="text-[14px] font-semibold text-success">{b.conversion}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Preço</p>
                    <p className="text-[14px] font-semibold">{b.price}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Editar order bump")}>
                    Editar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
            Pré-visualização
          </p>
          <CheckoutPreviewFrame
            slotMiddle={
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                />
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold">
                    Sim, quero adicionar Mentoria Individual!
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                    Oferta exclusiva com 40% OFF —{" "}
                    <span className="font-semibold text-foreground">R$ 97,00</span>
                  </span>
                </span>
              </label>
            }
          />
        </div>
      </div>
    </>
  );
}

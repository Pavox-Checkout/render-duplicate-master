import { createFileRoute } from "@tanstack/react-router";
import { Plus, ArrowUpCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { ToolStatusBadge } from "@/components/pavox/marketing/tool-status-badge";
import { Button } from "@/components/ui/button";
import { UPSELLS } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/upsell")({
  component: UpsellPage,
  head: () => ({
    meta: [
      { title: "Upsell · PAVOX" },
      {
        name: "description",
        content:
          "Ofertas pós-compra (one-click upsell) exibidas após a aprovação do pagamento.",
      },
    ],
  }),
});

function UpsellPage() {
  const upsells = UPSELLS;

  return (
    <>
      <PageHeader
        title="Upsell"
        subtitle="Apresente ofertas one-click logo após a compra, aproveitando o cartão já aprovado do cliente."
        actions={
          <Button size="sm" onClick={() => toast.info("Criar upsell")}>
            <Plus className="h-4 w-4" /> Novo upsell
          </Button>
        }
      />

      <div className="surface flex flex-col items-center gap-2 p-5 sm:flex-row sm:gap-4">
        <FlowStep label="Compra aprovada" tone="muted" />
        <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground sm:rotate-0" />
        <FlowStep label="Oferta de upsell" tone="primary" />
        <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground sm:rotate-0" />
        <FlowStep label="Confirmação / obrigado" tone="muted" />
      </div>

      {upsells.length === 0 ? (
        <EmptyState
          icon={ArrowUpCircle}
          title="Nenhum upsell configurado"
          description="Crie uma oferta pós-compra para aumentar a receita sem novo esforço de aquisição."
        />
      ) : (
        <div className="space-y-3">
          {upsells.map((u) => (
            <div key={u.id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <ArrowUpCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[14px] font-semibold">{u.offer}</h3>
                  <ToolStatusBadge status={u.status} />
                </div>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Gatilho: {u.trigger}
                </p>
              </div>
              <div className="flex items-center gap-5 text-right">
                <div>
                  <p className="text-[11px] text-muted-foreground">Aceitação</p>
                  <p className="text-[14px] font-semibold text-success">{u.conversion}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Preço</p>
                  <p className="text-[14px] font-semibold">{u.price}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Editar upsell")}>
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function FlowStep({ label, tone }: { label: string; tone: "muted" | "primary" }) {
  return (
    <div
      className={
        tone === "primary"
          ? "flex-1 rounded-lg border-2 border-primary/40 bg-primary/5 px-3 py-2.5 text-center text-[12.5px] font-semibold text-primary"
          : "flex-1 rounded-lg border border-border bg-secondary px-3 py-2.5 text-center text-[12.5px] font-medium text-muted-foreground"
      }
    >
      {label}
    </div>
  );
}

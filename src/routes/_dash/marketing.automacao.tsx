import { createFileRoute } from "@tanstack/react-router";
import { Plus, Workflow, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { ToolStatusBadge } from "@/components/pavox/marketing/tool-status-badge";
import { Button } from "@/components/ui/button";
import { AUTOMATIONS } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/automacao")({
  component: AutomacaoPage,
  head: () => ({
    meta: [
      { title: "Automação · PAVOX" },
      {
        name: "description",
        content: "Crie fluxos automáticos disparados por eventos do checkout.",
      },
    ],
  }),
});

function AutomacaoPage() {
  const automations = AUTOMATIONS;

  return (
    <>
      <PageHeader
        title="Automação"
        subtitle="Conecte gatilhos a ações e deixe o pós-venda, a recuperação e o rastreamento no piloto automático."
        actions={
          <Button size="sm" onClick={() => toast.info("Criar automação")}>
            <Plus className="h-4 w-4" /> Nova automação
          </Button>
        }
      />

      {automations.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="Nenhuma automação criada"
          description="Crie um fluxo automático disparado por eventos como compra aprovada ou checkout abandonado."
        />
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <div
              key={a.id}
              className="surface flex flex-col gap-3 p-4 lg:flex-row lg:items-center"
            >
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Quando
                    </p>
                    <p className="text-[12.5px] font-medium">{a.trigger}</p>
                  </div>
                </div>

                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />

                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
                  <Workflow className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Então
                    </p>
                    <p className="text-[12.5px] font-medium">{a.action}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:justify-end">
                <ToolStatusBadge status={a.status} />
                <Button variant="outline" size="sm" onClick={() => toast.info("Editar automação")}>
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

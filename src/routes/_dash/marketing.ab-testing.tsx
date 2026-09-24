import { createFileRoute } from "@tanstack/react-router";
import { Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { ToolStatusBadge } from "@/components/pavox/marketing/tool-status-badge";
import { Button } from "@/components/ui/button";
import { AB_TESTS } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/ab-testing")({
  component: ABTestingPage,
  head: () => ({
    meta: [
      { title: "A/B Testing · PAVOX" },
      {
        name: "description",
        content: "Compare variações do seu checkout e descubra qual converte mais.",
      },
    ],
  }),
});

function ABTestingPage() {
  const tests = AB_TESTS;

  return (
    <>
      <PageHeader
        title="A/B Testing"
        subtitle="Teste variações de checkout dividindo o tráfego e acompanhe qual gera melhores resultados."
        actions={
          <Button size="sm" onClick={() => toast.info("Criar teste A/B")}>
            <Plus className="h-4 w-4" /> Novo teste
          </Button>
        }
      />

      {tests.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="Nenhum teste em andamento"
          description="Crie um teste A/B para comparar variações do seu checkout e otimizar a conversão."
        />
      ) : (
        <div className="space-y-3">
          {tests.map((t) => {
            const [a, b] = t.traffic.split("/").map((n) => Number(n.trim()));
            return (
              <div key={t.id} className="surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <FlaskConical className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[14.5px] font-semibold">{t.name}</h3>
                      <p className="text-[12px] text-muted-foreground">
                        Métrica: {t.metric}
                      </p>
                    </div>
                  </div>
                  <ToolStatusBadge status={t.status} />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium">A · {t.variantA}</span>
                    <span className="text-muted-foreground">{a ?? 0}%</span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="bg-primary" style={{ width: `${a ?? 0}%` }} />
                    <div className="bg-primary/40" style={{ width: `${b ?? 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium">B · {t.variantB}</span>
                    <span className="text-muted-foreground">{b ?? 0}%</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info("Ver resultados")}>
                    Ver resultados
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.success(t.status === "Ativo" ? "Teste pausado" : "Teste retomado")
                    }
                  >
                    {t.status === "Ativo" ? "Pausar" : "Retomar"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

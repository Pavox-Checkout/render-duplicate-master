import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Star, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { ToolStatusBadge } from "@/components/pavox/marketing/tool-status-badge";
import { SettingToggle } from "@/components/pavox/marketing/setting-toggle";
import { CheckoutPreviewFrame } from "@/components/pavox/marketing/checkout-preview-frame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOCIAL_PROOFS } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/provas-sociais")({
  component: ProvasSociaisPage,
  head: () => ({
    meta: [
      { title: "Provas sociais · PAVOX" },
      {
        name: "description",
        content: "Exiba depoimentos e avaliações no checkout para aumentar a confiança e a conversão.",
      },
    ],
  }),
});

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

function ProvasSociaisPage() {
  const [enabled, setEnabled] = useState(true);
  const proofs = SOCIAL_PROOFS;
  const featured = proofs[0];

  return (
    <>
      <PageHeader
        title="Provas sociais"
        subtitle="Depoimentos e avaliações exibidos no checkout para reforçar a decisão de compra."
        actions={
          <Button size="sm" onClick={() => toast.info("Adicionar depoimento")}>
            <Plus className="h-4 w-4" /> Novo depoimento
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="space-y-3">
          <div className="surface p-4">
            <SettingToggle
              label="Exibir provas sociais no checkout"
              description="Mostra os depoimentos ativos abaixo do resumo do pedido."
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {proofs.length === 0 ? (
            <EmptyState
              icon={MessageSquareQuote}
              title="Nenhum depoimento cadastrado"
              description="Adicione avaliações de clientes para aumentar a confiança no checkout."
            />
          ) : (
            proofs.map((p) => (
              <div key={p.id} className="surface flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-[12px] font-semibold text-primary-foreground">
                      {p.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold">{p.name}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {p.product} · {p.date}
                      </p>
                    </div>
                  </div>
                  <ToolStatusBadge status={p.status} />
                </div>
                <Stars rating={p.rating} />
                <p className="text-[13px] text-muted-foreground">{p.text}</p>
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
              enabled && featured ? (
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <Stars rating={featured.rating} />
                  <p className="mt-1.5 text-[12px] text-foreground">"{featured.text}"</p>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    — {featured.name}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
                  Provas sociais desativadas
                </div>
              )
            }
          />
        </div>
      </div>
    </>
  );
}

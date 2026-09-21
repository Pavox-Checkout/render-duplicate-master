import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Plus, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { Button } from "@/components/ui/button";
import { brl, checkouts } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/checkouts/")({
  component: Checkouts,
  head: () => ({
    meta: [
      { title: "Checkouts · PAVOX" },
      {
        name: "description",
        content: "Gerencie seus checkouts personalizados e compare conversão entre eles.",
      },
      { property: "og:title", content: "Checkouts · PAVOX" },
      { property: "og:description", content: "Seu checkout. Mais conversão. Mais vendas." },
    ],
  }),
});

function Checkouts() {
  return (
    <>
      <PageHeader
        title="Checkouts"
        subtitle="Cada checkout é uma página de compra com conversão medida individualmente."
        actions={
          <Button asChild>
            <Link to="/checkouts/novo">
              <Plus className="h-4 w-4" /> Criar checkout
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {checkouts.map((c) => (
          <div key={c.id} className="surface flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-[12.5px] text-muted-foreground">{c.product}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-secondary/60 p-3 text-center">
              <div>
                <p className="font-display text-[17px] font-bold text-primary">{c.conversion.toString().replace(".", ",")}%</p>
                <p className="text-[11px] text-muted-foreground">Conversão</p>
              </div>
              <div>
                <p className="font-display text-[17px] font-bold">{c.sales.toLocaleString("pt-BR")}</p>
                <p className="text-[11px] text-muted-foreground">Vendas</p>
              </div>
              <div>
                <p className="font-display text-[17px] font-bold">{brl(c.revenue)}</p>
                <p className="text-[11px] text-muted-foreground">Faturamento</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/checkouts/novo">
                  <Settings2 className="h-4 w-4" /> Editar
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => toast("Prévia pública disponível após publicar")}
              >
                <ExternalLink className="h-4 w-4" /> Visualizar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

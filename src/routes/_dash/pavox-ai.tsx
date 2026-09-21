import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { useOrders, useProducts } from "@/lib/pavox-data";

export const Route = createFileRoute("/_dash/pavox-ai")({
  component: PavoxAI,
  head: () => ({
    meta: [
      { title: "Pavox AI · PAVOX" },
      {
        name: "description",
        content: "Recomendações inteligentes para aumentar a conversão do seu checkout.",
      },
      { property: "og:title", content: "Pavox AI · PAVOX" },
      { property: "og:description", content: "Inteligência aplicada ao seu checkout." },
    ],
  }),
});

function PavoxAI() {
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const hasData = orders.length > 0 || products.length > 0;

  return (
    <>
      <PageHeader
        title="Pavox AI"
        subtitle="Inteligência aplicada aos dados reais da sua operação."
      />

      <div className="surface p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Recomendações</h2>
        </div>
        <EmptyState
          className="mt-5 border-0 bg-secondary/40"
          icon={Sparkles}
          title="Precisamos de dados para começar."
          description={
            hasData
              ? "Assim que seus checkouts registrarem vendas, as recomendações aparecerão aqui."
              : "Crie seu primeiro produto e checkout para que a Pavox AI possa analisar sua operação."
          }
          action={
            <Button asChild>
              <Link to="/produtos">
                <Package className="h-4 w-4" /> Criar primeiro produto
              </Link>
            </Button>
          }
        />
      </div>
    </>
  );
}

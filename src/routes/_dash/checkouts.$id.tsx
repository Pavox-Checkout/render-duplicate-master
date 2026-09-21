import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { BuilderEditor } from "@/components/pavox/builder/builder-editor";
import { useCheckout } from "@/lib/checkouts-data";

export const Route = createFileRoute("/_dash/checkouts/$id")({
  component: EditarCheckout,
  head: () => ({
    meta: [
      { title: "Checkout Builder · PAVOX" },
      {
        name: "description",
        content: "Edite blocos, aparência e ofertas do seu checkout PAVOX com preview em tempo real.",
      },
      { property: "og:title", content: "Checkout Builder · PAVOX" },
      { property: "og:description", content: "Construtor visual de checkout da PAVOX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function EditarCheckout() {
  const { id } = useParams({ from: "/_dash/checkouts/$id" });
  const { data: checkout, isLoading } = useCheckout(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!checkout) {
    return (
      <EmptyState
        title="Checkout não encontrado"
        description="Ele pode ter sido excluído ou pertence a outra conta."
        action={
          <Button asChild>
            <Link to="/checkouts">Voltar para checkouts</Link>
          </Button>
        }
      />
    );
  }

  return <BuilderEditor key={checkout.id} checkout={checkout} />;
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Settings2, ShoppingBag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProducts } from "@/lib/pavox-data";
import { deleteCheckout, useCheckoutList } from "@/lib/checkouts-data";
import { useSubscription } from "@/lib/billing";
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

const dateBR = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

function Checkouts() {
  const { data: checkouts = [], isLoading } = useCheckoutList();
  const { data: products = [] } = useProducts();
  const { data: subscription } = useSubscription();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const limit = subscription?.plan?.checkout_limit ?? 3;
  const reachedLimit = checkouts.length >= limit;

  const handleCreate = () => {
    if (reachedLimit) {
      toast.error(`Você atingiu o limite de ${limit} checkouts do seu plano.`);
      return;
    }
    void navigate({ to: "/checkouts/novo" });
  };

  const createButton = (label: string) => (
    <Button onClick={handleCreate}>
      <Plus className="h-4 w-4" /> {label}
    </Button>
  );

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCheckout(toDelete);
      await queryClient.invalidateQueries({ queryKey: ["checkouts"] });
      toast.success("Checkout excluído");
    } catch {
      toast.error("Não foi possível excluir o checkout.");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Checkouts"
        subtitle={`Cada checkout é uma página de compra com conversão medida individualmente. ${checkouts.length} de ${limit} usados.`}
        actions={createButton("Criar checkout")}
      />

      {!isLoading && checkouts.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Você ainda não criou nenhum checkout."
          description="Crie seu primeiro checkout para começar a vender."
          action={createButton("Criar checkout")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {checkouts.map((c) => {
            const product = products.find((p) => p.id === c.product_id);
            return (
              <div key={c.id} className="surface flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{c.name}</h3>
                    <p className="truncate text-[12.5px] text-muted-foreground">
                      {product ? product.name : "Nenhum produto vinculado"}
                    </p>
                  </div>
                  <StatusBadge status={c.published ? "Publicado" : "Rascunho"} />
                </div>

                <p className="mt-2 truncate text-[12px] text-muted-foreground">
                  {c.published ? `/c/${c.slug}` : "Sem link publicado"}
                </p>

                <dl className="mt-4 space-y-1 text-[12.5px]">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Criado em</dt>
                    <dd>{dateBR(c.created_at)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Atualizado em</dt>
                    <dd>{dateBR(c.updated_at)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Publicação</dt>
                    <dd>{c.published ? dateBR(c.published_at) : "Não publicado"}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/checkouts/$id" params={{ id: c.id }}>
                      <Settings2 className="h-4 w-4" /> Editar
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast("Prévia pública disponível em breve")}
                    aria-label="Visualizar"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setToDelete(c.id)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir checkout?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O checkout e suas configurações serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

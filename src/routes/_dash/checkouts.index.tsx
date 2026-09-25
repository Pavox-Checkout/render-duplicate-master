import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  EyeOff,
  Eye,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  deleteCheckout,
  publicCheckoutPath,
  publicCheckoutUrl,
  unpublishCheckout,
  useCheckoutList,
  type CheckoutRecord,
} from "@/lib/checkouts-data";
import { useAuth } from "@/hooks/useAuth";
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
  value
    ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

const timeBR = (value: string | null) =>
  value ? new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Layers;
  label: string;
  value: number | string;
  hint: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[13px] text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function Checkouts() {
  const { data: checkouts = [], isLoading } = useCheckoutList();
  const { data: products = [] } = useProducts();
  const { data: subscription } = useSubscription();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const storeSlug = profile?.store_slug ?? "";
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");

  const limit = subscription?.plan?.checkout_limit ?? 3;
  const reachedLimit = checkouts.length >= limit;
  const publishedCount = checkouts.filter((c) => c.published).length;
  const draftCount = checkouts.length - publishedCount;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return checkouts.filter((c) => {
      const matchTerm = !term || c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term);
      const matchStatus =
        status === "todos" ||
        (status === "publicado" && c.published) ||
        (status === "rascunho" && !c.published);
      return matchTerm && matchStatus;
    });
  }, [checkouts, search, status]);

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

  const openPublic = (c: CheckoutRecord) => {
    if (!c.published) {
      toast.error("Publique o checkout para gerar o link público.");
      return;
    }
    if (!storeSlug) return;
    window.open(publicCheckoutUrl(storeSlug, c.slug), "_blank", "noopener,noreferrer");
  };

  const copyPublic = (c: CheckoutRecord) => {
    if (!storeSlug) return;
    navigator.clipboard?.writeText(publicCheckoutUrl(storeSlug, c.slug));
    toast.success("Link copiado");
  };

  const unpublish = async (id: string) => {
    try {
      await unpublishCheckout(id);
      await queryClient.invalidateQueries({ queryKey: ["checkouts"] });
      toast.success("Checkout despublicado. O link público deixou de funcionar.");
    } catch {
      toast.error("Não foi possível despublicar o checkout.");
    }
  };

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
        subtitle="Gerencie seus checkouts e otimize suas vendas. Crie, edite e acompanhe o desempenho dos seus funis de checkout."
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
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={CreditCard}
              label="Total de checkouts"
              value={checkouts.length}
              hint="Checkouts criados"
              tone="bg-primary/10 text-primary"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Publicados"
              value={publishedCount}
              hint="Ativos e prontos para uso"
              tone="bg-emerald-500/10 text-emerald-600"
            />
            <SummaryCard
              icon={Eye}
              label="Rascunhos"
              value={draftCount}
              hint="Em edição ou não publicados"
              tone="bg-violet-500/10 text-violet-600"
            />
            <SummaryCard
              icon={Layers}
              label="Limite do plano"
              value={limit}
              hint="Checkouts disponíveis"
              tone="bg-sky-500/10 text-sky-600"
            />
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Seus checkouts</h2>
              <p className="text-[13px] text-muted-foreground">
                Acompanhe e gerencie todos os seus checkouts criados.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar checkout..."
                  className="pl-9"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="publicado">Publicados</SelectItem>
                  <SelectItem value="rascunho">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[840px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-border/70 bg-secondary/30 text-[12.5px] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Publicado em</th>
                  <th className="px-4 py-3 font-medium">Última atualização</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const product =
                    products.find((p) => p.id === c.product_id) ?? products.find((p) => p.checkout_id === c.id);
                  return (
                    <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/20">
                      <td className="px-4 py-4">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {storeSlug ? publicCheckoutPath(storeSlug, c.slug) : `/${c.slug}`}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {product ? (
                          <>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-[12px] text-muted-foreground">Produto vinculado</p>
                          </>
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">Nenhum produto</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.published ? "Publicado" : "Rascunho"} />
                      </td>
                      <td className="px-4 py-4">
                        <p>{c.published ? dateBR(c.published_at) : "—"}</p>
                        {c.published ? (
                          <p className="text-[12px] text-muted-foreground">{timeBR(c.published_at)}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <p>{dateBR(c.updated_at)}</p>
                        <p className="text-[12px] text-muted-foreground">{timeBR(c.updated_at)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Abrir checkout público"
                            onClick={() => openPublic(c)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button asChild variant="outline" size="icon" className="h-8 w-8" aria-label="Editar">
                            <Link to="/checkouts/$id" params={{ id: c.id }}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Mais ações">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to="/checkouts/$id" params={{ id: c.id }}>
                                  <Pencil className="h-4 w-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              {c.published ? (
                                <>
                                  <DropdownMenuItem onClick={() => copyPublic(c)}>
                                    <Copy className="h-4 w-4" /> Copiar link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => void unpublish(c.id)}>
                                    <EyeOff className="h-4 w-4" /> Despublicar
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setToDelete(c.id)}
                              >
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                      Nenhum checkout encontrado para os filtros aplicados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
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

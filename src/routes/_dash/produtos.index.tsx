import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Archive,
  Copy,
  Filter,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Power,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { ProductImage } from "@/components/pavox/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { brl } from "@/lib/mock";
import { useProducts } from "@/lib/pavox-data";
import { PRODUCT_TYPE_LABEL } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_dash/produtos/")({
  component: Produtos,
  head: () => ({
    meta: [
      { title: "Produtos · PAVOX" },
      {
        name: "description",
        content: "Cadastre e gerencie seus produtos, ofertas e variações na PAVOX.",
      },
      { property: "og:title", content: "Produtos · PAVOX" },
      { property: "og:description", content: "Gerencie seus produtos e ofertas em um só catálogo." },
    ],
  }),
});

function Produtos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [type, setType] = useState("todos");
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
        const matchStatus = status === "todos" || p.status === status;
        const matchType = type === "todos" || p.type === type;
        return matchSearch && matchStatus && matchType;
      }),
    [items, search, status, type],
  );

  const summary = useMemo(
    () => ({
      total: items.length,
      active: items.filter((p) => p.status === "Ativo").length,
      inactive: items.filter((p) => p.status !== "Ativo").length,
      outOfStock: items.filter(
        (p) => p.type === "fisico" && p.track_inventory && Number(p.inventory_quantity ?? 0) <= 0,
      ).length,
    }),
    [items],
  );

  const hasFilters = Boolean(search.trim()) || status !== "todos" || type !== "todos";
  const clearFilters = () => {
    setSearch("");
    setStatus("todos");
    setType("todos");
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "Ativo" ? "Inativo" : "Ativo";
    const { error } = await supabase.from("products").update({ status: next }).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar o status");
      return;
    }
    void refresh();
    toast.success(next === "Ativo" ? "Produto ativado" : "Produto desativado");
  };

  const duplicate = async (id: string) => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error || !data) {
      toast.error("Não foi possível duplicar o produto");
      return;
    }
    const { id: _id, created_at, updated_at, user_id, ...rest } = data as Record<string, unknown> & { id: string };
    void _id;
    void created_at;
    void updated_at;
    void user_id;
    const { data: created, error: insErr } = await supabase
      .from("products")
      .insert({ ...rest, name: `${data.name} (cópia)`, slug: "", status: "Inativo" } as never)
      .select("id")
      .single();
    if (insErr || !created) {
      toast.error("Não foi possível duplicar o produto");
      return;
    }

    const { data: variants } = await supabase.from("product_variants").select("*").eq("product_id", id);
    if (variants?.length) {
      const rows = variants.map((v) => {
        const { id: _vid, created_at: _c, updated_at: _u, user_id: _uid, ...vrest } = v as Record<string, unknown>;
        void _vid;
        void _c;
        void _u;
        void _uid;
        return { ...vrest, product_id: created.id } as never;
      });
      await supabase.from("product_variants").insert(rows);
    }
    void refresh();
    toast.success("Produto duplicado como inativo");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await supabase.from("products").delete().eq("id", toDelete.id);
    setBusy(false);
    setToDelete(null);
    if (error) {
      toast.error("Não foi possível excluir o produto");
      return;
    }
    void refresh();
    toast.success("Produto excluído");
  };

  const createButton = (label: string) => (
    <Button onClick={() => void navigate({ to: "/produtos/novo" })}>
      <Plus className="h-4 w-4" /> {label}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Gerencie o catálogo, estoque e disponibilidade dos seus produtos."
        actions={createButton("Novo produto")}
      />

      {!isLoading && items.length === 0 ? (

        <EmptyState
          icon={Package}
          title="Você ainda não possui produtos"
          description="Cadastre seu primeiro produto para começar a criar seus checkouts."
          action={createButton("Criar primeiro produto")}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total de produtos", value: summary.total, icon: Package, tone: "text-primary" },
              { label: "Produtos ativos", value: summary.active, icon: Activity, tone: "text-emerald-400" },
              { label: "Produtos inativos", value: summary.inactive, icon: Archive, tone: "text-muted-foreground" },
              { label: "Sem estoque", value: summary.outOfStock, icon: SlidersHorizontal, tone: "text-amber-400" },
            ].map((card) => (
              <div key={card.label} className="surface flex items-center gap-3 p-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ${card.tone}`}>
                  <card.icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">{card.label}</p>
                  <p className="mt-0.5 text-xl font-semibold tracking-tight">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="surface flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm font-medium lg:mr-1">
              <Filter className="h-4 w-4 text-primary" />
              Filtros
            </div>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome do produto"
                className="border-border/70 bg-background/50 pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="lg:w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="lg:w-[170px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="fisico">Físico</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="servico">Serviço</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0 text-muted-foreground">
                <X className="h-4 w-4" /> Limpar
              </Button>
            ) : null}
          </div>

          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Produto</th>
                    <th className="px-5 py-2.5 font-medium">SKU</th>
                    <th className="px-5 py-2.5 font-medium">Tipo</th>
                    <th className="px-5 py-2.5 font-medium">Preço</th>
                    <th className="px-5 py-2.5 font-medium">Estoque</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Última atualização</th>
                    <th className="px-5 py-2.5 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                      <td className="px-5 py-3">
                        <Link to="/produtos/$id" params={{ id: p.id }} className="flex items-center gap-3">
                          <ProductImage
                            path={p.main_image}
                            alt={p.name}
                            className="h-9 w-9"
                            fallbackText={p.name.slice(0, 2).toUpperCase()}
                          />
                          <div>
                            <p className="font-medium">{p.name}</p>
                            {p.description ? (
                              <p className="line-clamp-1 text-[12px] text-muted-foreground">{p.description}</p>
                            ) : null}
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">—</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {PRODUCT_TYPE_LABEL[p.type] ?? "Físico"}
                      </td>
                      <td className="px-5 py-3">
                        {p.promotional_price !== null && p.promotional_price !== undefined ? (
                          <span className="flex flex-col">
                            <span className="text-[12px] text-muted-foreground line-through">
                              {brl(Number(p.price))}
                            </span>
                            <span className="font-medium text-success">{brl(Number(p.promotional_price))}</span>
                          </span>
                        ) : (
                          brl(Number(p.price))
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {p.type === "fisico" && p.track_inventory ? p.inventory_quantity : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Ações de ${p.name}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => void navigate({ to: "/produtos/$id", params: { id: p.id } })}>
                              <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void duplicate(p.id)}>
                              <Copy className="h-4 w-4" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void toggleStatus(p.id, p.status)}>
                              <Power className="h-4 w-4" /> {p.status === "Ativo" ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setToDelete({ id: p.id, name: p.name })}
                            >
                              <Trash2 className="h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                        Nenhum produto encontrado com esses filtros.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não poderá ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void confirmDelete()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

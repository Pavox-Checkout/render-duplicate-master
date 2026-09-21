import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/mock";
import { useProducts } from "@/lib/pavox-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/produtos/")({
  component: Produtos,
  head: () => ({
    meta: [
      { title: "Produtos · PAVOX" },
      {
        name: "description",
        content: "Cadastre e gerencie os produtos vendidos nos seus checkouts PAVOX.",
      },
      { property: "og:title", content: "Produtos · PAVOX" },
      { property: "og:description", content: "Catálogo de produtos e desempenho de receita." },
    ],
  }),
});

function Produtos() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useProducts();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("Ativo");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim() || !price.trim()) {
      toast.error("Informe nome e preço do produto");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("products").insert({
      name: name.trim(),
      description: description.trim(),
      price: Number(price.replace(/\./g, "").replace(",", ".")) || 0,
      status,
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível salvar o produto");
      return;
    }
    setName("");
    setDescription("");
    setPrice("");
    setOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success("Produto criado com sucesso");
  };

  const newProductButton = (label: string) => (
    <Button onClick={() => setOpen(true)}>
      <Plus className="h-4 w-4" /> {label}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Tudo que você vende, organizado em um só catálogo."
        actions={newProductButton("Novo produto")}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar ao catálogo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kit Premium" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o produto para o cliente"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input id="preco" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="297,00" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Rascunho">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void create()} disabled={busy}>
              Salvar produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isLoading && items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Você ainda não possui produtos."
          description="Crie seu primeiro produto para começar a vender pela PAVOX."
          action={newProductButton("Criar produto")}
        />
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Produto</th>
                  <th className="px-5 py-2.5 font-medium">Preço</th>
                  <th className="px-5 py-2.5 font-medium">Criado em</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-[12px] font-bold text-accent-foreground">
                          {p.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.description ? (
                            <p className="line-clamp-1 text-[12px] text-muted-foreground">{p.description}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{brl(Number(p.price))}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

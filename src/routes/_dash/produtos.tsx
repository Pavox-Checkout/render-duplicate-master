import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl, products as seed } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/produtos")({
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
  const [items, setItems] = useState(seed);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("Ativo");

  const create = () => {
    if (!name.trim() || !price.trim()) {
      toast.error("Informe nome e preço do produto");
      return;
    }
    setItems((prev) => [
      {
        id: `p${prev.length + 1}`,
        name,
        sku: `PVX-NEW-0${prev.length + 1}`,
        price: Number(price.replace(",", ".")) || 0,
        sales: 0,
        revenue: 0,
        status,
      },
      ...prev,
    ]);
    setName("");
    setPrice("");
    setOpen(false);
    toast.success("Produto criado com sucesso");
  };

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Tudo que você vende, organizado em um só catálogo."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Novo produto
              </Button>
            </DialogTrigger>
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
                  <Textarea id="desc" placeholder="Descreva o produto para o cliente" rows={3} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="preco">Preço (R$)</Label>
                    <Input id="preco" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="297,00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" placeholder="PVX-KIT-01" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Imagem</Label>
                  <div className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border text-[13px] text-muted-foreground hover:border-primary/50">
                    <ImagePlus className="h-4 w-4" /> Arraste uma imagem ou clique para enviar
                  </div>
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={create}>Salvar produto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Produto</th>
                <th className="px-5 py-2.5 font-medium">Preço</th>
                <th className="px-5 py-2.5 font-medium">Vendas</th>
                <th className="px-5 py-2.5 font-medium">Receita</th>
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
                        <p className="text-[12px] text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{brl(p.price)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.sales}</td>
                  <td className="px-5 py-3 font-semibold">{brl(p.revenue)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

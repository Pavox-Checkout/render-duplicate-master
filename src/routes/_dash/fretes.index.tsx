import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { StatusBadge } from "@/components/pavox/status-badge";
import { useProducts } from "@/lib/pavox-data";
import { useCheckoutList } from "@/lib/checkouts-data";
import { Truck, Plus, MoreHorizontal, Pencil, Power, Trash2, Upload, PackageOpen } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Shipping = { id: string; name: string; description: string; price: string; delivery: string; active: boolean; checkouts: string[]; image?: string };

export const Route = createFileRoute("/_dash/fretes/")({
  component: Fretes,
  head: () => ({ meta: [{ title: "Fretes · PAVOX" }, { name: "description", content: "Configure as opções de entrega dos seus produtos físicos." }] }),
});

function Fretes() {
  const navigate = useNavigate();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: checkouts = [] } = useCheckoutList();
  const physicalProducts = useMemo(() => products.filter((product) => product.type === "fisico"), [products]);
  const [shipping, setShipping] = useState<Shipping[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shipping | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", delivery: "", active: true, checkouts: [] as string[], image: "" });

  const startCreate = () => { setEditing(null); setForm({ name: "", description: "", price: "", delivery: "", active: true, checkouts: [], image: "" }); setOpen(true); };
  const startEdit = (item: Shipping) => { setEditing(item); setForm(item); setOpen(true); };
  const save = () => {
    if (!form.name.trim() || !form.delivery.trim()) { toast.error("Informe o nome e o prazo de entrega."); return; }
    const item = { ...form, id: editing?.id ?? crypto.randomUUID(), name: form.name.trim(), description: form.description.trim() };
    setShipping((current) => editing ? current.map((row) => row.id === editing.id ? item : row) : [...current, item]);
    setOpen(false); toast.success(editing ? "Frete atualizado" : "Frete criado");
  };
  const toggle = (id: string) => setShipping((current) => current.map((row) => row.id === id ? { ...row, active: !row.active } : row));
  const remove = (id: string) => setShipping((current) => current.filter((row) => row.id !== id));

  if (!productsLoading && physicalProducts.length === 0) return <><PageHeader title="Fretes" subtitle="Crie e personalize as opções de entrega que seus clientes poderão selecionar no checkout." /><EmptyState icon={PackageOpen} title="Nenhum produto físico cadastrado" description="Cadastre um produto físico para começar a configurar seus fretes." action={<Button onClick={() => void navigate({ to: "/produtos/novo" })}><Plus className="h-4 w-4" /> Cadastrar produto físico</Button>} /></>;

  return <>
    <PageHeader title="Fretes" subtitle="Crie e personalize as opções de entrega que seus clientes poderão selecionar no checkout." actions={<Button onClick={startCreate}><Plus className="h-4 w-4" /> Adicionar frete</Button>} />
    {shipping.length === 0 ? <EmptyState icon={Truck} title="Nenhum frete cadastrado" description="Adicione uma opção de entrega para seus produtos físicos." action={<Button onClick={startCreate}><Plus className="h-4 w-4" /> Adicionar frete</Button>} /> : <div className="surface overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-secondary/50 text-left text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Frete</th><th className="px-5 py-3 font-medium">Valor</th><th className="px-5 py-3 font-medium">Prazo</th><th className="px-5 py-3 font-medium">Checkouts</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3" /></tr></thead><tbody>{shipping.map((item) => <tr key={item.id} className="border-b border-border/60 last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">{item.image ? <img src={item.image} alt="" className="size-full object-cover" /> : <Truck className="h-5 w-5" />}</div><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.description || "Sem descrição"}</p></div></div></td><td className="px-5 py-4 font-medium">{item.price ? `R$ ${item.price}` : "Grátis"}</td><td className="px-5 py-4 text-muted-foreground">{item.delivery}</td><td className="px-5 py-4 text-muted-foreground">{item.checkouts.length || "Nenhum"}</td><td className="px-5 py-4"><StatusBadge status={item.active ? "Ativo" : "Inativo"} /></td><td className="px-5 py-4 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações de {item.name}</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => startEdit(item)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => toggle(item.id)}><Power className="mr-2 h-4 w-4" /> {item.active ? "Desativar" : "Ativar"}</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => remove(item.id)}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></div></div>}

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? "Editar frete" : "Adicionar frete"}</DialogTitle><DialogDescription>Configure uma opção de entrega para os seus produtos físicos.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-2"><Label htmlFor="shipping-name">Nome do frete</Label><Input id="shipping-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: PAC" /></div><div className="grid gap-2"><Label htmlFor="shipping-description">Descrição</Label><Textarea id="shipping-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Entrega econômica" /></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="shipping-price">Valor (R$)</Label><Input id="shipping-price" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0,00" /></div><div className="grid gap-2"><Label htmlFor="shipping-delivery">Prazo de entrega</Label><Input id="shipping-delivery" value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })} placeholder="2 a 5 dias" /></div></div><div className="grid gap-2"><Label>Imagem do frete</Label><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-secondary/50"><Upload className="h-4 w-4" /> {form.image ? "Imagem selecionada" : "Selecionar imagem (opcional)"}<input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) setForm({ ...form, image: URL.createObjectURL(file) }); }} /></label></div><div className="grid gap-2"><Label>Checkouts associados</Label>{checkouts.length === 0 ? <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">Você ainda não possui checkouts.</p> : checkouts.map((checkout) => <label key={checkout.id} className="flex items-center gap-2 text-sm"><Checkbox checked={form.checkouts.includes(checkout.id)} onCheckedChange={(checked) => setForm({ ...form, checkouts: checked ? [...form.checkouts, checkout.id] : form.checkouts.filter((id) => id !== checkout.id) })} />{checkout.name}</label>)}</div><div className="flex items-center justify-between rounded-lg border border-border p-3"><div><Label htmlFor="shipping-active">Frete ativo</Label><p className="text-xs text-muted-foreground">Disponível para seleção no checkout</p></div><Switch id="shipping-active" checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>{editing ? "Salvar alterações" : "Criar frete"}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

export default Fretes;

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Ticket, Copy, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { ToolStatusBadge } from "@/components/pavox/marketing/tool-status-badge";
import { MockCheckoutSelect } from "@/components/pavox/marketing/mock-checkout-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COUPONS } from "@/lib/marketing-data";

export const Route = createFileRoute("/_dash/marketing/cupons")({
  component: CuponsPage,
  head: () => ({
    meta: [
      { title: "Cupons · PAVOX" },
      { name: "description", content: "Crie e gerencie cupons de desconto para seus checkouts." },
    ],
  }),
});

function CuponsPage() {
  const [open, setOpen] = useState(false);
  const [checkout, setCheckout] = useState("all");
  const coupons = COUPONS;

  return (
    <>
      <PageHeader
        title="Cupons"
        subtitle="Ofereça descontos com códigos promocionais e acompanhe o desempenho de cada um."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo cupom
          </Button>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Nenhum cupom criado"
          description="Crie seu primeiro cupom para oferecer descontos e incentivar compras."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Novo cupom
            </Button>
          }
        />
      ) : (
        <div className="surface overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Usos</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold hover:text-primary"
                      onClick={() => {
                        void navigator.clipboard?.writeText(c.code);
                        toast.success(`Código ${c.code} copiado`);
                      }}
                    >
                      {c.code}
                      <Copy className="h-3.5 w-3.5 opacity-50" />
                    </button>
                  </TableCell>
                  <TableCell className="font-semibold">{c.discount}</TableCell>
                  <TableCell className="text-muted-foreground">{c.type}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.used}
                    {c.limit ? (
                      <span className="text-muted-foreground"> / {c.limit}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.validity}</TableCell>
                  <TableCell>
                    <ToolStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Editar cupom")}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.success(
                              c.status === "Ativo" ? "Cupom pausado" : "Cupom ativado",
                            )
                          }
                        >
                          {c.status === "Ativo" ? "Pausar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => toast.success("Cupom excluído")}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo cupom</DialogTitle>
            <DialogDescription>
              Configure um código promocional para aplicar no checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="code">Código</Label>
              <Input id="code" placeholder="Ex.: BEMVINDO10" className="font-mono uppercase" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <Select defaultValue="percent">
                  <SelectTrigger id="type" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual</SelectItem>
                    <SelectItem value="fixed">Valor fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="value">Valor</Label>
                <Input id="value" placeholder="10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="limit">Limite de usos</Label>
                <Input id="limit" placeholder="Ilimitado" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiry">Validade</Label>
                <Input id="expiry" type="date" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coupon-checkout">Aplicar em</Label>
              <MockCheckoutSelect id="coupon-checkout" value={checkout} onChange={setCheckout} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.success("Cupom criado com sucesso.");
                setOpen(false);
              }}
            >
              Criar cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

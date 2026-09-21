import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Search } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl, orders, type OrderStatus } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/pedidos/")({
  component: Pedidos,
  head: () => ({
    meta: [
      { title: "Pedidos · PAVOX" },
      {
        name: "description",
        content: "Gerencie todos os pedidos do seu checkout: aprovados, pendentes e recusados.",
      },
      { property: "og:title", content: "Pedidos · PAVOX" },
      { property: "og:description", content: "Todos os pedidos da sua operação em um só lugar." },
    ],
  }),
});

const filters = ["Todos", "Aprovados", "Pendentes", "Recusados", "Reembolsados"] as const;
const mapStatus: Record<string, OrderStatus> = {
  Aprovados: "Aprovado",
  Pendentes: "Pendente",
  Recusados: "Recusado",
  Reembolsados: "Reembolsado",
};

function Pedidos() {
  const [filter, setFilter] = useState<string>("Todos");
  const [q, setQ] = useState("");

  const rows = orders.filter((o) => {
    const byStatus = filter === "Todos" || o.status === mapStatus[filter];
    const term = q.trim().toLowerCase();
    const bySearch =
      !term ||
      o.id.toLowerCase().includes(term) ||
      o.customer.toLowerCase().includes(term) ||
      o.product.toLowerCase().includes(term);
    return byStatus && bySearch;
  });

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Histórico completo das transações processadas pela PAVOX."
        actions={
          <Button variant="outline" onClick={() => toast.success("Exportação iniciada (protótipo)")}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                filter === f
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pedido ou cliente"
            className="pl-9"
          />
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Pedido</th>
                <th className="px-5 py-2.5 font-medium">Cliente</th>
                <th className="px-5 py-2.5 font-medium">Produto</th>
                <th className="px-5 py-2.5 font-medium">Valor</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Gateway</th>
                <th className="px-5 py-2.5 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                  <td className="px-5 py-3">
                    <Link
                      to="/pedidos/$id"
                      params={{ id: o.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      #{o.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{o.customer}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.product}</td>
                  <td className="px-5 py-3 font-semibold">{brl(o.amount)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{o.gateway}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="font-semibold">Nenhum pedido encontrado</p>
            <p className="text-[13px] text-muted-foreground">
              Ajuste os filtros ou tente outro termo de busca.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

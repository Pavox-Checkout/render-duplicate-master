import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Download, Receipt, Search } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl } from "@/lib/mock";
import { useOrders } from "@/lib/pavox-data";
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
const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  card: "Cartão de crédito",
  boleto: "Boleto",
};

const mapStatus: Record<string, string> = {
  Aprovados: "Aprovado",
  Pendentes: "Pendente",
  Recusados: "Recusado",
  Reembolsados: "Reembolsado",
};

function Pedidos() {
  const [filter, setFilter] = useState<string>("Todos");
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrders();

  const rows = orders.filter((o) => {
    const byStatus = filter === "Todos" || o.status === mapStatus[filter];
    const term = q.trim().toLowerCase();
    const bySearch = !term || o.reference.toLowerCase().includes(term);
    return byStatus && bySearch;
  });

  const isEmptyAccount = !isLoading && orders.length === 0;

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Histórico completo das transações processadas pela PAVOX."
        actions={
          <Button
            variant="outline"
            disabled={isEmptyAccount}
            onClick={() => toast.success("Exportação iniciada")}
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      {isEmptyAccount ? (
        <EmptyState
          icon={Receipt}
          title="Nenhum pedido ainda."
          description="Quando seus clientes realizarem compras, seus pedidos aparecerão aqui."
        />
      ) : (
        <>
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
                placeholder="Buscar pedido"
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
                    <th className="px-5 py-2.5 font-medium">Valor</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Método</th>
                    <th className="px-5 py-2.5 font-medium">Data</th>
                    <th className="w-10 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate({ to: "/pedidos/$id", params: { id: o.id } })}
                      className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-secondary/40"
                    >
                      <td className="px-5 py-3 font-medium">
                        <Link
                          to="/pedidos/$id"
                          params={{ id: o.id }}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          #{o.reference || o.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-semibold">{brl(Number(o.amount))}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {METHOD_LABELS[o.payment_method] ?? (o.payment_method || "—")}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </td>
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
      )}
    </>
  );
}

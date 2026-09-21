import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, Mail, RotateCcw } from "lucide-react";
import { StatusBadge } from "@/components/pavox/status-badge";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/mock";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/pedidos/$id")({
  component: PedidoDetalhe,
  head: () => ({
    meta: [
      { title: "Detalhes do pedido · PAVOX" },
      {
        name: "description",
        content: "Veja cliente, pagamento e linha do tempo completa do pedido.",
      },
      { property: "og:title", content: "Detalhes do pedido · PAVOX" },
      { property: "og:description", content: "Linha do tempo completa da transação." },
    ],
  }),
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-[13.5px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function PedidoDetalhe() {
  const { id } = Route.useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/pedidos">
          <ArrowLeft className="h-4 w-4" /> Voltar para pedidos
        </Link>
      </Button>

      {!order ? (
        !isLoading && (
          <EmptyState
            title="Pedido não encontrado."
            description="Este pedido não existe ou não pertence à sua conta."
          />
        )
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold">
                Pedido #{order.reference || order.id.slice(0, 8)}
              </h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-[13px] text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(order.id);
                  toast.success("ID do pedido copiado");
                }}
              >
                <Copy className="h-4 w-4" /> Copiar ID
              </Button>
              <Button variant="outline" onClick={() => toast("E-mail reenviado ao cliente")}>
                <Mail className="h-4 w-4" /> Reenviar recibo
              </Button>
              <Button variant="outline" onClick={() => toast("Reembolso disponível em breve")}>
                <RotateCcw className="h-4 w-4" /> Reembolsar
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="surface p-5">
              <h2 className="text-base font-semibold">Resumo</h2>
              <div className="mt-4 divide-y divide-border">
                <Row label="Valor" value={brl(Number(order.amount))} />
                <Row label="Desconto" value={brl(0)} />
                <Row label="Total" value={brl(Number(order.amount))} />
              </div>
            </div>
            <div className="surface p-5">
              <h2 className="text-base font-semibold">Pagamento</h2>
              <div className="mt-3 divide-y divide-border">
                <Row label="Método" value={order.payment_method || "—"} />
                <Row label="Status" value={order.status} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

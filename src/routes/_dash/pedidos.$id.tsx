import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { ArrowLeft, Copy, Loader2, Mail, RotateCcw } from "lucide-react";
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

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  card: "Cartão de crédito",
  boleto: "Boleto",
};

/** Merchant order actions run on the backend (Edge Function `orders`). */
async function orderAction(action: "refund" | "resend_receipt", orderId: string) {
  const { data, error } = await supabase.functions.invoke("orders", { body: { action, orderId } });
  if (error) {
    let message = "Não foi possível falar com o servidor. Tente novamente.";
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = (await error.context.json()) as { message?: string };
        if (payload?.message) message = payload.message;
      } catch {
        // keep the generic message
      }
    }
    throw new Error(message);
  }
  return data as { message: string };
}

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
  const qc = useQueryClient();
  const [confirmRefund, setConfirmRefund] = useState(false);
  const refund = useMutation({
    mutationFn: () => orderAction("refund", id),
    onSuccess: (res) => {
      toast.success(res.message);
      setConfirmRefund(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Não foi possível reembolsar."),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
  const resend = useMutation({
    mutationFn: () => orderAction("resend_receipt", id),
    onSuccess: (res) => toast.success(res.message),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Não foi possível reenviar."),
  });
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(order.id);
                  toast.success("ID do pedido copiado");
                }}
              >
                <Copy className="h-4 w-4" /> Copiar ID
              </Button>
              <Button
                variant="outline"
                disabled={order.status !== "Aprovado" || resend.isPending}
                title={
                  order.status !== "Aprovado" ? "Disponível para pedidos aprovados" : undefined
                }
                onClick={() => resend.mutate()}
              >
                {resend.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Reenviar recibo
              </Button>
              <Button
                variant="outline"
                disabled={order.status !== "Aprovado" || refund.isPending}
                title={
                  order.status !== "Aprovado" ? "Disponível para pedidos aprovados" : undefined
                }
                onClick={() => setConfirmRefund(true)}
              >
                <RotateCcw className="h-4 w-4" /> Reembolsar
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="surface p-5">
              <h2 className="text-base font-semibold">Resumo</h2>
              <div className="mt-4 divide-y divide-border">
                <Row
                  label="Produto"
                  value={String((order.product_snapshot as { name?: string } | null)?.name ?? "—")}
                />
                <Row label="Subtotal" value={brl(Number(order.subtotal))} />
                <Row label="Desconto" value={brl(Number(order.discount))} />
                <Row label="Total" value={brl(Number(order.amount))} />
                {order.status === "Aprovado" ? (
                  <Row label="Taxa PAVOX" value={brl(Number(order.platform_fee))} />
                ) : null}
              </div>
              <h2 className="mt-6 text-base font-semibold">Cliente</h2>
              <div className="mt-2 divide-y divide-border">
                <Row
                  label="Nome"
                  value={String((order.buyer as { name?: string } | null)?.name ?? "—")}
                />
                <Row
                  label="E-mail"
                  value={String((order.buyer as { email?: string } | null)?.email ?? "—")}
                />
              </div>
            </div>
            <div className="surface p-5">
              <h2 className="text-base font-semibold">Pagamento</h2>
              <div className="mt-3 divide-y divide-border">
                <Row
                  label="Método"
                  value={METHOD_LABELS[order.payment_method ?? ""] ?? (order.payment_method || "—")}
                />
                <Row label="Status" value={order.status} />
                <Row
                  label="Gateway"
                  value={order.gateway === "mercadopago" ? "Mercado Pago" : order.gateway || "—"}
                />
                {order.paid_at ? (
                  <Row label="Pago em" value={new Date(order.paid_at).toLocaleString("pt-BR")} />
                ) : null}
                {order.gateway_payment_id ? (
                  <div className="flex items-center justify-between gap-4 py-2.5 text-[13.5px]">
                    <span className="text-muted-foreground">ID no gateway</span>
                    <button
                      type="button"
                      className="inline-flex min-w-0 items-center gap-1.5 font-mono text-[12px] font-medium hover:text-primary"
                      onClick={() => {
                        void navigator.clipboard?.writeText(order.gateway_payment_id!);
                        toast.success("ID da transação copiado");
                      }}
                    >
                      <span className="truncate">{order.gateway_payment_id}</span>
                      <Copy className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <AlertDialog
            open={confirmRefund}
            onOpenChange={(o) => !refund.isPending && setConfirmRefund(o)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reembolsar {brl(Number(order.amount))}?</AlertDialogTitle>
                <AlertDialogDescription>
                  O valor total volta para o comprador pelo mesmo meio de pagamento, direto pelo
                  Mercado Pago. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={refund.isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={refund.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    refund.mutate();
                  }}
                >
                  {refund.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Reembolsar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}

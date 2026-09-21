import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Mail, RotateCcw, Copy } from "lucide-react";
import { StatusBadge } from "@/components/pavox/status-badge";
import { Button } from "@/components/ui/button";
import { brl, orders } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/pedidos/$id")({
  component: PedidoDetalhe,
  loader: ({ params }) => {
    const order = orders.find((o) => o.id === params.id);
    if (!order) throw notFound();
    return order;
  },
  head: () => ({
    meta: [
      { title: "Detalhes do pedido · PAVOX" },
      {
        name: "description",
        content: "Veja cliente, pagamento, gateway e linha do tempo completa do pedido.",
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
  const order = Route.useLoaderData();

  const timeline = [
    { label: "Checkout iniciado", time: "10:39" },
    { label: "Dados do cliente informados", time: "10:40" },
    { label: "Pagamento iniciado", time: "10:41" },
    {
      label: order.status === "Aprovado" ? "Pagamento aprovado" : `Pagamento ${order.status.toLowerCase()}`,
      time: "10:42",
    },
  ];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/pedidos">
          <ArrowLeft className="h-4 w-4" /> Voltar para pedidos
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Pedido #{order.id}</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-[13px] text-muted-foreground">{order.date}</span>
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
        <div className="space-y-5">
          <div className="surface p-5">
            <h2 className="text-base font-semibold">Itens do pedido</h2>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">{order.product}</p>
                <p className="text-[12.5px] text-muted-foreground">Quantidade: 1</p>
              </div>
              <span className="font-display font-semibold">{brl(order.amount)}</span>
            </div>
            <div className="mt-4 divide-y divide-border">
              <Row label="Subtotal" value={brl(order.amount)} />
              <Row label="Desconto" value={brl(0)} />
              <Row label="Taxa do gateway" value={brl(Math.round(order.amount * 0.0399 * 100) / 100)} />
              <Row label="Total recebido" value={brl(Math.round(order.amount * 0.9601 * 100) / 100)} />
            </div>
          </div>

          <div className="surface p-5">
            <h2 className="text-base font-semibold">Linha do tempo</h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((t, i) => (
                <li key={t.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    {i < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-[13.5px] font-medium">{t.label}</p>
                    <p className="text-[12px] text-muted-foreground">{t.time}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface p-5">
            <h2 className="text-base font-semibold">Cliente</h2>
            <div className="mt-3 divide-y divide-border">
              <Row label="Nome" value={order.customer} />
              <Row label="E-mail" value={order.email} />
              <Row label="Documento" value="***.456.789-**" />
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="text-base font-semibold">Pagamento</h2>
            <div className="mt-3 divide-y divide-border">
              <Row label="Método" value={order.method} />
              <Row label="Gateway" value={order.gateway} />
              <Row label="Parcelas" value={order.method === "Cartão" ? "3x sem juros" : "À vista"} />
              <Row label="Checkout" value="Checkout Principal" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

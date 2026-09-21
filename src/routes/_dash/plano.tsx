import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_dash/plano")({
  component: Plano,
  head: () => ({
    meta: [
      { title: "Plano e cobrança · PAVOX" },
      { name: "description", content: "Seu plano atual, uso mensal e histórico de faturas na PAVOX." },
      { property: "og:title", content: "Plano e cobrança · PAVOX" },
      { property: "og:description", content: "Planos que acompanham o crescimento da sua loja." },
    ],
  }),
});

const plans = [
  { name: "Starter", price: "R$ 0", desc: "Para começar a vender", features: ["1 checkout", "Até 100 pedidos/mês", "Relatórios básicos"] },
  {
    name: "Growth",
    price: "R$ 197",
    desc: "Para quem já vende todo dia",
    features: ["Checkouts ilimitados", "Recuperação automática", "Analytics avançado", "Pavox AI"],
    current: true,
  },
  { name: "Scale", price: "R$ 597", desc: "Para operações de alto volume", features: ["Múltiplos gateways", "Roteamento inteligente", "Suporte prioritário", "SLA dedicado"] },
];

const invoices = [
  { id: "FT-2026-09", date: "01 set 2026", value: "R$ 197,00", status: "Paga" },
  { id: "FT-2026-08", date: "01 ago 2026", value: "R$ 197,00", status: "Paga" },
  { id: "FT-2026-07", date: "01 jul 2026", value: "R$ 197,00", status: "Paga" },
];

function Plano() {
  return (
    <>
      <PageHeader title="Plano e cobrança" subtitle="Seu plano atual, uso e faturas." />

      <div className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.12em] text-primary uppercase">Plano atual</p>
            <h2 className="mt-1 font-display text-xl font-bold">Growth · R$ 197/mês</h2>
            <p className="text-[13px] text-muted-foreground">Próxima cobrança em 01 out 2026</p>
          </div>
          <Button variant="outline" onClick={() => toast("Gestão de assinatura em breve")}>
            Gerenciar assinatura
          </Button>
        </div>
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Pedidos processados neste mês</span>
            <span className="font-medium">1.284 de 3.000</span>
          </div>
          <Progress value={43} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={cn(
              "surface flex flex-col p-5",
              p.current && "border-primary/40 shadow-[var(--shadow-lift)]",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{p.name}</h3>
              {p.current && (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11.5px] font-semibold text-accent-foreground">
                  Atual
                </span>
              )}
            </div>
            <p className="mt-3 font-display text-2xl font-bold">
              {p.price}
              <span className="text-[13px] font-medium text-muted-foreground">/mês</span>
            </p>
            <p className="text-[13px] text-muted-foreground">{p.desc}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13px]">
                  <Check className="h-4 w-4 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Button
              variant={p.current ? "outline" : "default"}
              className="mt-5"
              disabled={p.current}
              onClick={() => toast.success(`Upgrade para ${p.name} solicitado`)}
            >
              {p.current ? "Plano atual" : "Escolher plano"}
            </Button>
          </div>
        ))}
      </div>

      <div className="surface overflow-hidden">
        <div className="p-5">
          <h2 className="text-base font-semibold">Faturas</h2>
        </div>
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-y border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
              <th className="px-5 py-2.5 font-medium">Fatura</th>
              <th className="px-5 py-2.5 font-medium">Data</th>
              <th className="px-5 py-2.5 font-medium">Valor</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b border-border/70 last:border-0">
                <td className="px-5 py-3 font-medium">{i.id}</td>
                <td className="px-5 py-3 text-muted-foreground">{i.date}</td>
                <td className="px-5 py-3">{i.value}</td>
                <td className="px-5 py-3 text-success">{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

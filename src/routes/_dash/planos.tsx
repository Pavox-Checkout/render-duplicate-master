import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Loader2, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";
import {
  BILLING_TYPE_LABEL,
  PLAN_STATUS_LABEL,
  pct,
  selectPlan,
  useBillingRecords,
  usePlans,
  useSubscription,
  useTransactionFees,
  type Plan,
} from "@/lib/billing";

export const Route = createFileRoute("/_dash/planos")({
  component: Planos,
  head: () => ({
    meta: [
      { title: "Planos · PAVOX" },
      {
        name: "description",
        content: "Gerencie seu plano PAVOX, taxas por transação, valores em aberto e histórico de cobranças.",
      },
      { property: "og:title", content: "Planos · PAVOX" },
      {
        property: "og:description",
        content: "Plano atual, taxas da PAVOX e valores em aberto da sua operação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const dateBR = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Planos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: plans = [] } = usePlans();
  const { data: subscription, isLoading } = useSubscription();
  const { data: records = [] } = useBillingRecords();
  const { data: fees = [] } = useTransactionFees();

  const current = subscription?.plan ?? null;
  const openFees = useMemo(() => fees.filter((f) => f.status === "aberto"), [fees]);
  const openTotal = openFees.reduce((sum, f) => sum + Number(f.fee_amount), 0);
  const openVolume = openFees.reduce((sum, f) => sum + Number(f.transaction_amount), 0);
  const referencePeriod =
    openFees[0]?.reference_period ||
    new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const handleChange = async (plan: Plan) => {
    if (!user) return;
    try {
      await selectPlan(user.id, plan);
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success(`Plano alterado para ${plan.name}`, {
        description:
          Number(plan.monthly_price) > 0
            ? "O pagamento da mensalidade será habilitado em breve."
            : "Alteração aplicada na sua conta.",
      });
    } catch (err) {
      const e = err as { code?: string; message?: string };
      console.error("[v0] falha ao alterar plano:", e);
      const detail = e.code ? `Erro ${e.code}: ${e.message ?? ""}` : e.message ?? "Tente novamente.";
      toast.error("Não foi possível alterar seu plano.", { description: detail });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Planos" subtitle="Seu plano, taxas da PAVOX e valores em aberto." />

      {/* Plano atual */}
      <div className="surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.12em] text-primary uppercase">Plano atual</p>
            <h2 className="mt-1 font-display text-xl font-bold">
              PAVOX {current?.name ?? "—"}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {current ? `${brl(Number(current.monthly_price))}/mês` : "Nenhum plano selecionado"}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
              subscription?.status === "active"
                ? "bg-success/10 text-success"
                : "bg-accent text-accent-foreground",
            )}
          >
            {PLAN_STATUS_LABEL[subscription?.status ?? ""] ?? "—"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <Info label="Taxa por transação" value={current ? pct(Number(current.transaction_fee_percent)) : "—"} />
          <Info label="Limite de checkouts" value={current ? `Até ${current.checkout_limit}` : "—"} />
          <Info
            label="Próxima cobrança"
            value={
              current && Number(current.monthly_price) > 0
                ? dateBR(subscription?.current_period_end ?? null)
                : "Sem cobrança recorrente"
            }
          />
        </div>
      </div>

      {/* Taxas da PAVOX + valores em aberto */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Taxas da PAVOX</h2>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            A taxa da PAVOX é separada da taxa cobrada pelo gateway de pagamento da sua conta.
          </p>
          <div className="mt-5 space-y-3">
            <Row label="Taxa do seu plano" value={current ? pct(Number(current.transaction_fee_percent)) : "—"} />
            <Row label="Volume sujeito à taxa" value={brl(openVolume)} />
            <Row label="Total de taxas em aberto" value={brl(openTotal)} strong />
          </div>
        </div>

        <div className="surface p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Valores em aberto</h2>
          </div>

          {openFees.length === 0 ? (
            <div className="mt-5">
              <p className="font-display text-2xl font-bold">{brl(0)}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Você não possui valores em aberto.</p>
              <p className="text-[13px] text-muted-foreground">Todas as suas taxas estão em dia.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="font-display text-2xl font-bold">{brl(openTotal)}</p>
              <Row label="Período de referência" value={referencePeriod} />
              <Row label="Transações" value={String(openFees.length)} />
              <Row
                label="Taxa aplicada"
                value={current ? pct(Number(current.transaction_fee_percent)) : "—"}
              />
              <Row label="Status" value="Em aberto" />
              <Button
                className="w-full"
                onClick={() =>
                  toast("Pagamento de taxas em breve", {
                    description: "O fluxo de pagamento das taxas PAVOX será liberado nesta área.",
                  })
                }
              >
                <CreditCard className="h-4 w-4" />
                Pagar agora
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comparação de planos */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Comparar planos</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === current?.id;
            const upgrade = current ? Number(plan.monthly_price) > Number(current.monthly_price) : true;
            return (
              <div
                key={plan.id}
                className={cn("surface flex flex-col p-5", isCurrent && "border-primary/40 shadow-[var(--shadow-lift)]")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">PAVOX {plan.name}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11.5px] font-semibold text-accent-foreground">
                      Plano atual
                    </span>
                  )}
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  {brl(Number(plan.monthly_price))}
                  <span className="text-[13px] font-medium text-muted-foreground">/mês</span>
                </p>
                <dl className="mt-3 space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Taxa PAVOX</dt>
                    <dd className="font-semibold">{pct(Number(plan.transaction_fee_percent))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Checkouts</dt>
                    <dd className="font-medium">Até {plan.checkout_limit}</dd>
                  </div>
                </dl>
                <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5"
                  variant={isCurrent ? "outline" : upgrade ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => void handleChange(plan)}
                >
                  {isCurrent ? "Plano atual" : upgrade ? "Fazer upgrade" : "Fazer downgrade"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico de cobranças */}
      <div className="surface overflow-hidden">
        <div className="p-5">
          <h2 className="text-base font-semibold">Histórico de cobranças</h2>
        </div>
        {records.length === 0 ? (
          <div className="px-5 pb-6">
            <EmptyState
              icon={Receipt}
              title="Você ainda não possui cobranças."
              description="Mensalidades e taxas da PAVOX aparecerão aqui assim que forem geradas."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-y border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Data</th>
                  <th className="px-5 py-2.5 font-medium">Descrição</th>
                  <th className="px-5 py-2.5 font-medium">Período</th>
                  <th className="px-5 py-2.5 font-medium">Tipo</th>
                  <th className="px-5 py-2.5 font-medium">Valor</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-3 text-muted-foreground">{dateBR(r.created_at)}</td>
                    <td className="px-5 py-3 font-medium">{r.description || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.reference_period || "—"}</td>
                    <td className="px-5 py-3">{BILLING_TYPE_LABEL[r.type] ?? r.type}</td>
                    <td className="px-5 py-3">{brl(Number(r.amount))}</td>
                    <td className="px-5 py-3">{r.status === "pago" ? "Pago" : "Em aberto"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{dateBR(r.paid_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13.5px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", strong && "font-display text-[16px] font-bold")}>{value}</span>
    </div>
  );
}

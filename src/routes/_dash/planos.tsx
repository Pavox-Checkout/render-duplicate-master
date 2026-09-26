import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { CreditCard, Loader2, Receipt, Wallet, AlertCircle, CalendarClock, LockKeyhole } from "lucide-react";
import { PageHeader } from "@/components/pavox/page-header";
import { EmptyState } from "@/components/pavox/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BILLING_TYPE_LABEL,
  PLAN_STATUS_LABEL,
  pct,
  useBillingRecords,
  useSubscription,
  useTransactionFees,
} from "@/lib/billing";

export const Route = createFileRoute("/_dash/planos")({
  component: Planos,
  head: () => ({
    meta: [
      { title: "Planos e pagamentos · PAVOX" },
      {
        name: "description",
        content: "Gerencie seu plano, forma de pagamento e cobranças da PAVOX.",
      },
    ],
  }),
});

const dateBR = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function Planos() {
  const { session } = useAuth();
  const {
    data: subscription,
    isLoading: loadingSubscription,
    isError: subscriptionError,
  } = useSubscription(!!session);
  const {
    data: records = [],
    isLoading: loadingRecords,
    isError: recordsError,
  } = useBillingRecords(!!session);
  const {
    data: fees = [],
    isLoading: loadingFees,
    isError: feesError,
  } = useTransactionFees(!!session);

  const current = subscription?.plan ?? null;
  const openFees = useMemo(() => fees.filter((fee) => fee.status === "aberto"), [fees]);
  const openTotal = openFees.reduce((sum, fee) => sum + Number(fee.fee_amount), 0);
  const hasError = subscriptionError || recordsError || feesError;
  const isLoading = loadingSubscription || loadingRecords || loadingFees;

  if (isLoading) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        aria-label="Carregando dados de billing"
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Planos e pagamentos"
        subtitle="Gerencie seu plano, forma de pagamento e cobranças da PAVOX."
      />

      {hasError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Não foi possível carregar todos os dados de billing.</p>
            <p className="mt-1 text-muted-foreground">
              Tente novamente mais tarde ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      )}

      <section className="surface p-5" aria-labelledby="plano-atual">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.12em] text-primary uppercase">
              Plano atual
            </p>
            <h2 id="plano-atual" className="mt-1 font-display text-xl font-bold">
              {current?.name ?? "Informações indisponíveis"}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {current
                ? `${brl(Number(current.monthly_price))} / mês`
                : "Informações do plano indisponíveis no momento."}
            </p>
          </div>
          <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
            {PLAN_STATUS_LABEL[subscription?.status ?? ""] ?? "Status indisponível"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label="Próxima cobrança"
            value={current ? dateBR(subscription?.current_period_end) : "—"}
          />
          <Info
            label="Limite de checkouts"
            value={current ? `Até ${current.checkout_limit}` : "—"}
          />
          <Info
            label="Taxa PAVOX"
            value={current ? pct(Number(current.transaction_fee_percent)) : "—"}
          />
          <Button variant="outline" disabled aria-disabled="true">
            Gerenciar plano
          </Button>
        </div>
      </section>

      <section aria-labelledby="taxas-pavox" className="space-y-4">
        <div>
          <h2 id="taxas-pavox" className="text-base font-semibold">
            Taxas PAVOX
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            As taxas da PAVOX são calculadas conforme a utilização da plataforma e cobradas de
            acordo com as condições do seu plano.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Wallet}
            label="Taxas em aberto"
            value={openFees.length ? brl(openTotal) : "—"}
          />
          <MetricCard
            icon={Receipt}
            label="Taxas cobradas"
            value={
              fees.length
                ? brl(
                    fees
                      .filter((fee) => fee.status !== "aberto")
                      .reduce((sum, fee) => sum + Number(fee.fee_amount), 0),
                  )
                : "—"
            }
          />
          <MetricCard icon={CalendarClock} label="Próxima cobrança" value="—" />
          <MetricCard
            icon={CreditCard}
            label="Taxa do plano atual"
            value={current ? pct(Number(current.transaction_fee_percent)) : "—"}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5" aria-labelledby="forma-pagamento">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h2 id="forma-pagamento" className="text-base font-semibold">
              Forma de pagamento
            </h2>
          </div>
          <div className="mt-5 rounded-lg border border-dashed border-border p-5 text-center">
            <p className="text-sm font-medium">Nenhuma forma de pagamento cadastrada</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Cadastre uma forma de pagamento para cobranças automáticas da PAVOX.
            </p>
            <PaymentMethodDialog />
          </div>
        </section>

        <section className="surface p-5" aria-labelledby="cobranca-automatica">
          <h2 id="cobranca-automatica" className="text-base font-semibold">
            Cobrança automática
          </h2>
          <div className="mt-5 rounded-lg border border-dashed border-border p-5 text-center">
            <p className="text-sm font-medium">
              A cobrança automática será exibida aqui quando sua conta estiver configurada.
            </p>
          </div>
        </section>
      </div>

      <section className="surface p-5" aria-labelledby="taxas-aberto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="taxas-aberto" className="text-base font-semibold">
              Taxas em aberto
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {openFees.length
                ? `${openFees.length} cobrança(s) aguardando pagamento.`
                : "Você não possui taxas em aberto."}
            </p>
          </div>
          <Button variant="outline" disabled>
            Pagar agora
          </Button>
        </div>
        {openFees.length > 0 && (
          <p className="mt-5 font-display text-2xl font-bold">{brl(openTotal)}</p>
        )}
      </section>

      <section className="surface overflow-hidden" aria-labelledby="historico-cobrancas">
        <div className="p-5">
          <h2 id="historico-cobrancas" className="text-base font-semibold">
            Histórico de cobranças
          </h2>
        </div>
        {records.length === 0 ? (
          <div className="px-5 pb-6">
            <EmptyState
              icon={Receipt}
              title="Você ainda não possui cobranças."
              description="As cobranças reais da PAVOX aparecerão aqui quando forem geradas."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-y border-border bg-secondary/50 text-left text-[12px] text-muted-foreground">
                  {["Data", "Descrição", "Tipo", "Valor", "Status", "Ações"].map((heading) => (
                    <th key={heading} className="px-5 py-2.5 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-3 text-muted-foreground">{dateBR(record.created_at)}</td>
                    <td className="px-5 py-3 font-medium">{record.description || "—"}</td>
                    <td className="px-5 py-3">{BILLING_TYPE_LABEL[record.type] ?? record.type}</td>
                    <td className="px-5 py-3">{brl(Number(record.amount))}</td>
                    <td className="px-5 py-3">{record.status || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function PaymentMethodDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    setNotice(
      "O provedor de pagamentos ainda não está conectado. O cartão não foi salvo. A tokenização segura será disponibilizada em uma próxima etapa.",
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4" variant="outline">
          Adicionar forma de pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar cartão de crédito</DialogTitle>
          <DialogDescription>
            Cadastre uma forma de pagamento para cobranças automáticas futuras da PAVOX.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Seus dados serão tokenizados pelo provedor quando a integração estiver disponível.</span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cardholder-name">Nome impresso no cartão</Label>
            <Input id="cardholder-name" name="cardholderName" autoComplete="cc-name" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="card-number">Número do cartão</Label>
            <Input
              id="card-number"
              name="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-expiry">Validade</Label>
              <Input id="card-expiry" name="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" maxLength={5} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-cvv">CVV</Label>
              <Input id="card-cvv" name="cvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cardholder-document">CPF/CNPJ do titular</Label>
            <Input id="cardholder-document" name="document" inputMode="numeric" required />
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <Checkbox name="automaticCharges" className="mt-0.5" />
            <span className="flex flex-col gap-1">
              <span className="font-medium">Usar este cartão para cobranças automáticas</span>
              <span className="text-muted-foreground">
                Este cartão poderá ser utilizado para cobranças automáticas de taxas e outros valores devidos à PAVOX.
              </span>
            </span>
          </label>

          {notice && (
            <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
              {notice}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Preparando conexão..." : "Adicionar cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="surface p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-4 text-[12px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-xl font-bold",
          value === "—" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

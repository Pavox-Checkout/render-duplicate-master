import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PavoxLogo } from "@/components/pavox/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePlans, useSubscription, selectPlan, pct, type Plan } from "@/lib/billing";
import { brl } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planos/selecionar")({
  component: SelecionarPlano,
  head: () => ({
    meta: [
      { title: "Escolha seu plano · PAVOX" },
      {
        name: "description",
        content: "Escolha o plano PAVOX ideal para sua operação e comece a vender hoje mesmo.",
      },
      { property: "og:title", content: "Escolha seu plano · PAVOX" },
      {
        property: "og:description",
        content: "Free, Growth ou Pro: planos PAVOX com taxas reduzidas por transação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SelecionarPlano() {
  const { session, user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading: loadingPlans } = usePlans();
  const { data: subscription, isLoading: loadingSub } = useSubscription(!!session);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (subscription) void navigate({ to: "/dashboard" });
  }, [subscription, navigate]);

  const handleSelect = async (plan: Plan) => {
    if (!user) return;
    setSaving(plan.id);
    try {
      await selectPlan(user.id, plan);
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success(`Plano ${plan.name} ativado`, {
        description:
          Number(plan.monthly_price) > 0
            ? "Seu acesso está liberado. O pagamento da mensalidade será habilitado em breve."
            : "Seu acesso está liberado.",
      });
      void navigate({ to: "/dashboard" });
    } catch {
      toast.error("Não foi possível salvar seu plano. Tente novamente.");
    } finally {
      setSaving(null);
    }
  };

  if (loading || loadingPlans || loadingSub) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex justify-center">
          <PavoxLogo />
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold sm:text-[32px]">Escolha seu plano</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Escolha o plano ideal para sua operação. Você pode alterar seu plano posteriormente.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              saving={saving === plan.id}
              disabled={saving !== null}
              onSelect={() => void handleSelect(plan)}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-[12.5px] text-muted-foreground">
          A taxa PAVOX é cobrada por transação aprovada e é separada da taxa do seu gateway de pagamento.
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  saving,
  disabled,
  onSelect,
}: {
  plan: Plan;
  saving: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const free = Number(plan.monthly_price) === 0;
  return (
    <div
      className={cn(
        "surface flex flex-col p-5",
        plan.highlight && "border-primary/40 shadow-[var(--shadow-lift)]",
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">PAVOX {plan.name}</h2>
        {plan.highlight && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11.5px] font-semibold text-accent-foreground">
            Mais escolhido
          </span>
        )}
      </div>

      <p className="mt-3 font-display text-2xl font-bold">
        {brl(Number(plan.monthly_price))}
        <span className="text-[13px] font-medium text-muted-foreground">/mês</span>
      </p>

      <dl className="mt-4 space-y-1.5 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Taxa PAVOX</dt>
          <dd className="font-semibold">{pct(Number(plan.transaction_fee_percent))} por transação</dd>
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
        variant={plan.highlight ? "default" : free ? "default" : "outline"}
        disabled={disabled}
        onClick={onSelect}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {free ? "Começar gratuitamente" : `Escolher ${plan.name}`}
      </Button>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Minus } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, AuthTitle } from "@/components/pavox/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  PLAN_CATALOG,
  resolvePlanIdBySlug,
  selectPlan,
  useSubscription,
  usePlans,
  pct,
  type PlanDisplay,
} from "@/lib/billing";
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
  // Carrega os planos do banco em segundo plano apenas para obter os IDs reais
  // (usados na persistência). Os cards renderizam sempre a partir do catálogo.
  const { data: dbPlans = [] } = usePlans();
  const { data: subscription, isLoading: loadingSub } = useSubscription(!!session);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (subscription) void navigate({ to: "/dashboard" });
  }, [subscription, navigate]);

  const handleSelect = async (plan: PlanDisplay) => {
    if (!user) {
      toast.error("Sua sessão expirou. Entre novamente para escolher um plano.");
      return;
    }
    setSaving(plan.slug);
    try {
      // Prefere o id já carregado; se indisponível, resolve sob demanda pelo slug.
      const fromCache = dbPlans.find((p) => p.slug === plan.slug)?.id ?? null;
      const planId = fromCache ?? (await resolvePlanIdBySlug(plan.slug));
      if (!planId) {
        // Slug não existe na tabela `plans` (planos não provisionados neste ambiente).
        toast.error(`O plano "${plan.name}" não está disponível no banco de dados.`, {
          description: `Nenhum registro com slug "${plan.slug}" foi encontrado na tabela plans.`,
        });
        return;
      }
      await selectPlan(user.id, {
        id: planId,
        name: plan.name,
        slug: plan.slug,
        monthly_price: plan.monthlyPrice,
        transaction_fee_percent: plan.feePercent,
        checkout_limit: 0,
        features: plan.features,
        highlight: plan.highlight,
        position: 0,
        active: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success(`Plano ${plan.name} ativado`, {
        description:
          plan.monthlyPrice > 0
            ? "Seu acesso está liberado. O pagamento da mensalidade será habilitado em breve."
            : "Seu acesso está liberado.",
      });
      void navigate({ to: "/dashboard" });
    } catch (err) {
      // Não silenciar a causa: mostra o código/mensagem reais do Supabase.
      const e = err as { code?: string; message?: string; details?: string };
      console.error("[v0] falha ao selecionar plano:", e);
      const detail = e.code
        ? `Erro ${e.code}: ${e.message ?? ""}`
        : (e.message ?? "Tente novamente.");
      toast.error("Não foi possível salvar seu plano.", { description: detail });
    } finally {
      setSaving(null);
    }
  };

  if (loading || loadingSub) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AuthShell greeting="Conta criada. Agora, o plano." wide>
      <AuthTitle title="Escolha seu plano">
        Você pode mudar de plano quando quiser. A taxa PAVOX vale só para vendas aprovadas e é
        separada da taxa do seu gateway.
      </AuthTitle>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_CATALOG.map((plan) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            saving={saving === plan.slug}
            disabled={saving !== null}
            onSelect={() => void handleSelect(plan)}
          />
        ))}
      </div>
    </AuthShell>
  );
}

function PlanCard({
  plan,
  saving,
  disabled,
  onSelect,
}: {
  plan: PlanDisplay;
  saving: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const free = plan.monthlyPrice === 0;
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border-[1.5px] bg-card p-6",
        plan.highlight ? "border-primary" : "border-border",
      )}
    >
      <h2 className="font-sans text-xl font-bold tracking-normal text-[#001848] dark:text-foreground">
        {plan.name}
        {plan.highlight && (
          <span className="ml-2 text-sm font-semibold text-primary">Recomendado</span>
        )}
      </h2>

      <p className="mt-3 text-[34px] font-bold tracking-[-0.02em] text-[#001848] tabular-nums dark:text-foreground">
        {brl(plan.monthlyPrice)}{" "}
        <span className="text-base font-medium tracking-normal text-muted-foreground">por mês</span>
      </p>
      <p className="mt-1 font-semibold">{pct(plan.feePercent)} por venda aprovada</p>
      <p className="text-[15px] text-muted-foreground">{plan.checkoutLabel}</p>

      <ul className="mt-5 flex-1 space-y-2 border-t border-border pt-5">
        {plan.features.map((f) => {
          const without = f.startsWith("Sem ");
          return (
            <li
              key={f}
              className={cn(
                "flex items-start gap-2 text-[15px]",
                without ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {without ? (
                <Minus aria-hidden="true" className="mt-1 size-4 shrink-0" />
              ) : (
                <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
              )}
              {f}
            </li>
          );
        })}
      </ul>

      <Button
        className="mt-6 h-12 rounded-[10px] text-[16px] font-bold"
        variant={plan.slug === "pro" ? "outline" : "default"}
        disabled={disabled}
        onClick={onSelect}
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        {free ? "Começar no Free" : `Escolher o ${plan.name}`}
      </Button>
    </div>
  );
}

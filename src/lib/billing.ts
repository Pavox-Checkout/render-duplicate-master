import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Plan = {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  transaction_fee_percent: number;
  checkout_limit: number;
  features: string[];
  highlight: boolean;
  position: number;
  active: boolean;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  pending_plan_id: string | null;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  plan: Plan | null;
};

export type BillingRecord = {
  id: string;
  type: string;
  description: string;
  reference_period: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
};

export type TransactionFee = {
  id: string;
  transaction_amount: number;
  fee_percent: number;
  fee_amount: number;
  status: string;
  reference_period: string;
  created_at: string;
};

const PLAN_FIELDS =
  "id, name, slug, monthly_price, transaction_fee_percent, checkout_limit, features, highlight, position, active";

function normalizePlan(row: Record<string, unknown>): Plan {
  return {
    ...(row as unknown as Plan),
    features: Array.isArray(row["features"]) ? (row["features"] as string[]) : [],
  };
}

export const pct = (value: number) =>
  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/**
 * Catálogo canônico dos planos PAVOX (fonte da verdade para exibição).
 * Mantido em código para que os cards sempre apareçam, independentemente de
 * hiccups de rede/token ou de o ambiente ter o seed do banco. A persistência da
 * seleção continua usando o `id` real da tabela `plans` (via slug).
 */
export type PlanDisplay = {
  slug: string;
  name: string;
  monthlyPrice: number;
  feePercent: number;
  checkoutLabel: string;
  highlight: boolean;
  features: string[];
};

export const PLAN_CATALOG: PlanDisplay[] = [
  {
    slug: "free",
    name: "Free",
    monthlyPrice: 0,
    feePercent: 1.99,
    checkoutLabel: "Até 3 checkouts",
    highlight: false,
    features: [
      "Produtos ilimitados",
      "1 domínio PAVOX",
      "Checkout básico",
      "Personalização básica",
      "Gestão de produtos, pedidos e clientes",
      "Dashboard básico",
      "Suporte por e-mail",
      "Sem domínio personalizado",
      "Sem recuperação de vendas",
      "Sem analytics avançado",
      "Sem Pavox AI",
      "Sem A/B Testing",
      "Sem recursos avançados de conversão",
    ],
  },
  {
    slug: "growth",
    name: "Growth",
    monthlyPrice: 29.9,
    feePercent: 1.49,
    checkoutLabel: "Até 10 checkouts",
    highlight: true,
    features: [
      "Produtos ilimitados",
      "Domínio personalizado",
      "Checkout avançado",
      "Order Bump",
      "Upsell",
      "Cupons",
      "Recuperação de vendas",
      "Analytics completo",
      "Relatórios completos",
      "Personalização avançada",
      "Suporte prioritário",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    monthlyPrice: 99,
    feePercent: 0.99,
    checkoutLabel: "Checkouts ilimitados",
    highlight: false,
    features: [
      "Produtos ilimitados",
      "Múltiplos domínios personalizados",
      "Tudo do Growth",
      "Pavox AI",
      "Analytics avançado",
      "A/B Testing",
      "Recursos premium de conversão",
      "Automação avançada",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
];

/**
 * Resolve o `id` real do plano na tabela `plans` a partir do slug (para persistir a seleção).
 * Lança em caso de erro de leitura (RLS/rede/sessão) para que a causa real não seja
 * silenciada; retorna `null` apenas quando o slug realmente não existe no banco.
 */
export async function resolvePlanIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase.from("plans").select("id").eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[v0] resolvePlanIdBySlug read error:", { slug, code: error.code, message: error.message });
    throw error;
  }
  return data ? (data as { id: string }).id : null;
}

export const PLAN_STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  pending: "Aguardando pagamento",
  canceled: "Cancelado",
  past_due: "Em atraso",
};

export const BILLING_TYPE_LABEL: Record<string, string> = {
  mensalidade: "Mensalidade",
  taxas: "Taxas PAVOX",
  ajuste: "Ajuste",
  credito: "Crédito",
};

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(PLAN_FIELDS)
        .eq("active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => normalizePlan(row as Record<string, unknown>));
    },
  });
}

export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: ["subscription"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          `id, user_id, plan_id, status, pending_plan_id, started_at, current_period_start, current_period_end, plan:plans!subscriptions_plan_id_fkey(${PLAN_FIELDS})`,
        )
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as Record<string, unknown>;
      return {
        ...(row as unknown as Subscription),
        plan: row["plan"] ? normalizePlan(row["plan"] as Record<string, unknown>) : null,
      } as Subscription;
    },
  });
}

export function useBillingRecords(enabled = true) {
  return useQuery({
    queryKey: ["billing_records"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_records")
        .select("id, type, description, reference_period, amount, status, due_date, paid_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BillingRecord[];
    },
  });
}

export function useTransactionFees(enabled = true) {
  return useQuery({
    queryKey: ["transaction_fees"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_fees")
        .select("id, transaction_amount, fee_percent, fee_amount, status, reference_period, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TransactionFee[];
    },
  });
}

/** Seleciona (ou troca) o plano da conta. Planos pagos ficam pendentes até o pagamento existir. */
export async function selectPlan(userId: string, plan: Plan) {
  const paid = Number(plan.monthly_price) > 0;
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: plan.id,
      status: paid ? "pending" : "active",
      pending_plan_id: paid ? plan.id : null,
      started_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

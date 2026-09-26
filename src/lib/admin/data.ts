import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "admin" | "viewer" | null;
export type AdminKind = "merchants" | "transactions" | "subscriptions" | "integrations" | "events";
export type AdminDays = 7 | 30 | 90;
export type MerchantRow = {
  id: string;
  company_name: string;
  full_name: string;
  email: string;
  store_slug: string;
  created_at: string;
  status: string;
  plan: string | null;
  monthly_price: number | null;
  transaction_fee_percent: number | null;
  current_period_end: string | null;
  published_checkouts: number;
};
export type TransactionRow = {
  id: string;
  reference: string;
  user_id: string;
  amount: number;
  platform_fee: number;
  currency: string;
  status: string;
  payment_method: string;
  gateway: string | null;
  created_at: string;
  paid_at: string | null;
  merchant: string;
  customer: string | null;
  customer_email: string | null;
};
export type IntegrationRow = {
  id: string;
  user_id: string;
  provider: string;
  environment: string;
  status: string;
  enabled_payment_methods: string[];
  last_tested_at: string | null;
  last_test_status: string | null;
  created_at: string;
  merchant: string;
};
export type EventRow = {
  id: string;
  created_at: string;
  source: "webhook" | "admin";
  provider: string | null;
  action: string;
  status: string;
  result: string | null;
  order_id: string | null;
  merchant: string;
  actor: string | null;
};
export type AdminRow = MerchantRow | TransactionRow | IntegrationRow | EventRow;
export type AdminList = { rows: AdminRow[]; total: number; page: number; page_size: number };
export type AdminOverview = {
  from: string;
  to: string;
  volume: number;
  fees: number;
  paid_orders: number;
  orders: number;
  pending_orders: number;
  merchants: number;
  new_merchants: number;
  published_checkouts: number;
  integration_errors: number;
  webhook_rejections: number;
  series: { day: string; amount: number; orders: number }[];
};
export type MerchantDetail = {
  orders: number;
  volume: number;
  checkouts: { id: string; name: string; slug: string; published: boolean }[];
  notes: { id: string; body: string; created_at: string; actor: string | null }[];
};
export type ListFilters = { query: string; status: string; page: number; days: AdminDays };

// Every query is scoped to the signed-in identity and removed when unused.
// Authorization also runs inside every RPC; hiding a route is not permission.
const queryOptions = { retry: false, gcTime: 0, staleTime: 0 } as const;

export function useAdminAccess() {
  const { user } = useAuth();
  return useQuery({
    ...queryOptions,
    queryKey: ["platform-admin", user?.id, "access"],
    enabled: !!user,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.rpc("pavox_admin_access").abortSignal(signal);
      if (error) throw error;
      const role = (data as { role?: string } | null)?.role;
      return { role: role === "admin" || role === "viewer" ? role : null } as { role: AdminRole };
    },
  });
}

export function useAdminOverview(days: AdminDays) {
  const { user } = useAuth();
  return useQuery({
    ...queryOptions,
    queryKey: ["platform-admin", user?.id, "overview", days],
    enabled: !!user,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .rpc("pavox_admin_overview", { p_days: days })
        .abortSignal(signal);
      if (error) throw error;
      return data as unknown as AdminOverview;
    },
  });
}

export function useAdminList(kind: AdminKind, filters: ListFilters) {
  const { user } = useAuth();
  return useQuery({
    ...queryOptions,
    queryKey: ["platform-admin", user?.id, "list", kind, filters],
    enabled: !!user,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .rpc("pavox_admin_list", {
          p_kind: kind,
          p_query: filters.query,
          p_status: filters.status,
          p_page: filters.page,
          p_days: filters.days,
        })
        .abortSignal(signal);
      if (error) throw error;
      return data as unknown as AdminList;
    },
  });
}

export function useAdminMerchant(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    ...queryOptions,
    queryKey: ["platform-admin", user?.id, "merchant", id],
    enabled: !!user && !!id,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .rpc("pavox_admin_merchant", { p_merchant_id: id! })
        .abortSignal(signal);
      if (error) throw error;
      return data as unknown as MerchantDetail;
    },
  });
}

export function useAddAdminNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ merchantId, body }: { merchantId: string; body: string }) => {
      const { data, error } = await supabase.rpc("pavox_admin_add_note", {
        p_merchant_id: merchantId,
        p_body: body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform-admin", user?.id] }),
  });
}

export function adminErrorMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "42501")
    return "Sua conta não tem permissão para esta ação. Entre com uma conta autorizada.";
  if (code === "PGRST202")
    return "A administração ainda não foi habilitada neste ambiente. Conclua a configuração do painel.";
  return "Não foi possível carregar os dados. Verifique sua conexão e tente novamente.";
}

export const money = (value: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
export const count = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
export const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(value))
    : "—";
export const merchantName = (row: MerchantRow) => row.company_name || row.full_name || row.email;

const labels: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  canceled: "Cancelado",
  past_due: "Em atraso",
  none: "Sem plano",
  connected: "Conectado",
  disabled: "Desativado",
  error: "Erro",
  not_connected: "Não conectado",
  processed: "Processado",
  rejected: "Rejeitado",
  received: "Recebido",
  recorded: "Registrado",
  production: "Produção",
  sandbox: "Teste",
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  merchant_note_added: "Nota interna adicionada",
  admin: "Administração",
  webhook: "Webhook",
  mercadopago: "Mercado Pago",
  stripe: "Stripe",
  asaas: "Asaas",
  pagarme: "Pagar.me",
};
export const label = (value: string | null) => (value ? (labels[value] ?? value) : "—");

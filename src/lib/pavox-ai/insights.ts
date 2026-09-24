import { useMemo } from "react";
import {
  useCheckouts,
  useCustomers,
  useOrders,
  useProducts,
  type OrderRow,
  type ProductRow,
} from "@/lib/pavox-data";
import { brl } from "@/lib/mock";

const PAID_STATUSES = new Set(["paid", "pago", "approved", "aprovado", "completed", "concluido"]);
const PENDING_STATUSES = new Set(["pending", "pendente", "aguardando", "waiting", "processing"]);
const FAILED_STATUSES = new Set(["failed", "falhou", "canceled", "cancelado", "refused", "recusado", "expired", "expirado"]);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function within<T extends { created_at: string }>(rows: T[], since: Date): T[] {
  return rows.filter((r) => new Date(r.created_at) >= since);
}

export type PavoxMetrics = {
  hasData: boolean;
  totalProducts: number;
  activeProducts: number;
  totalCheckouts: number;
  activeCheckouts: number;
  totalCustomers: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  revenue: number;
  revenue7d: number;
  revenue30d: number;
  aov: number;
  conversionRate: number;
  topProducts: { name: string; price: number }[];
  lowStock: { name: string; qty: number }[];
};

export type PavoxInsight = {
  id: string;
  tone: "positive" | "warning" | "neutral" | "opportunity";
  title: string;
  description: string;
};

function computeMetrics(
  products: ProductRow[],
  checkouts: { status: string; created_at: string }[],
  customers: { created_at: string }[],
  orders: OrderRow[],
): PavoxMetrics {
  const paid = orders.filter((o) => PAID_STATUSES.has((o.status || "").toLowerCase()));
  const pending = orders.filter((o) => PENDING_STATUSES.has((o.status || "").toLowerCase()));
  const failed = orders.filter((o) => FAILED_STATUSES.has((o.status || "").toLowerCase()));
  const revenue = paid.reduce((s, o) => s + Number(o.amount || 0), 0);
  const revenue7d = within(paid, daysAgo(7)).reduce((s, o) => s + Number(o.amount || 0), 0);
  const revenue30d = within(paid, daysAgo(30)).reduce((s, o) => s + Number(o.amount || 0), 0);
  const aov = paid.length > 0 ? revenue / paid.length : 0;
  const conversionRate = orders.length > 0 ? (paid.length / orders.length) * 100 : 0;

  const topProducts = [...products]
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    .slice(0, 3)
    .map((p) => ({ name: p.name, price: Number(p.price || 0) }));

  const lowStock = products
    .filter((p) => p.track_inventory && Number(p.inventory_quantity) <= 5)
    .slice(0, 5)
    .map((p) => ({ name: p.name, qty: Number(p.inventory_quantity) }));

  return {
    hasData: products.length > 0 || orders.length > 0 || checkouts.length > 0,
    totalProducts: products.length,
    activeProducts: products.filter((p) => (p.status || "").toLowerCase() === "active" || (p.status || "").toLowerCase() === "ativo").length,
    totalCheckouts: checkouts.length,
    activeCheckouts: checkouts.filter((c) => (c.status || "").toLowerCase() === "active" || (c.status || "").toLowerCase() === "ativo").length,
    totalCustomers: customers.length,
    totalOrders: orders.length,
    paidOrders: paid.length,
    pendingOrders: pending.length,
    failedOrders: failed.length,
    revenue,
    revenue7d,
    revenue30d,
    aov,
    conversionRate,
    topProducts,
    lowStock,
  };
}

function buildInsights(m: PavoxMetrics): PavoxInsight[] {
  const out: PavoxInsight[] = [];

  if (m.totalProducts === 0) {
    out.push({
      id: "no-products",
      tone: "neutral",
      title: "Cadastre seu primeiro produto",
      description: "A Pavox AI precisa de produtos e checkouts ativos para gerar recomendações personalizadas da sua operação.",
    });
  }

  if (m.totalOrders > 0) {
    if (m.conversionRate < 40 && m.failedOrders > 0) {
      out.push({
        id: "low-conversion",
        tone: "warning",
        title: `Conversão de pagamento em ${m.conversionRate.toFixed(1)}%`,
        description: `${m.failedOrders} ${m.failedOrders === 1 ? "pedido" : "pedidos"} não foram concluídos. Revise métodos de pagamento e a etapa final do checkout para recuperar receita.`,
      });
    } else if (m.conversionRate >= 60) {
      out.push({
        id: "good-conversion",
        tone: "positive",
        title: `Ótima conversão: ${m.conversionRate.toFixed(1)}%`,
        description: "Sua taxa de aprovação está saudável. Bom momento para escalar tráfego nos checkouts que mais convertem.",
      });
    }
  }

  if (m.pendingOrders > 0) {
    out.push({
      id: "pending-orders",
      tone: "opportunity",
      title: `${m.pendingOrders} ${m.pendingOrders === 1 ? "pedido pendente" : "pedidos pendentes"}`,
      description: "Dispare lembretes de pagamento (PIX/boleto) nas próximas horas — pendentes recuperados são receita quase garantida.",
    });
  }

  if (m.revenue7d > 0 && m.revenue30d > 0) {
    const weeklyPace = m.revenue7d;
    const projected30 = weeklyPace * (30 / 7);
    out.push({
      id: "revenue-pace",
      tone: "neutral",
      title: `Ritmo de ${brl(m.revenue7d)} nos últimos 7 dias`,
      description: `Mantendo o ritmo atual, a projeção é de aproximadamente ${brl(projected30)} em 30 dias.`,
    });
  }

  if (m.lowStock.length > 0) {
    out.push({
      id: "low-stock",
      tone: "warning",
      title: `${m.lowStock.length} ${m.lowStock.length === 1 ? "produto" : "produtos"} com estoque baixo`,
      description: `Reponha ${m.lowStock.map((p) => `${p.name} (${p.qty})`).join(", ")} antes que a ruptura derrube suas vendas.`,
    });
  }

  if (m.aov > 0) {
    out.push({
      id: "aov-orderbump",
      tone: "opportunity",
      title: `Ticket médio de ${brl(m.aov)}`,
      description: "Adicione Order Bump e Upsell nos checkouts de maior volume para elevar o ticket médio sem aumentar o tráfego.",
    });
  }

  if (m.totalCheckouts > 0 && m.activeCheckouts === 0) {
    out.push({
      id: "no-active-checkout",
      tone: "warning",
      title: "Nenhum checkout ativo",
      description: "Você tem checkouts criados, mas nenhum ativo. Ative pelo menos um para começar a receber pedidos.",
    });
  }

  return out;
}

/**
 * Monta um resumo textual dos dados reais da conta para servir de contexto ao modelo.
 * Só envia números agregados — nunca dados sensíveis de clientes.
 */
export function buildAiContext(m: PavoxMetrics): string {
  const lines = [
    `Produtos cadastrados: ${m.totalProducts} (ativos: ${m.activeProducts})`,
    `Checkouts: ${m.totalCheckouts} (ativos: ${m.activeCheckouts})`,
    `Clientes: ${m.totalCustomers}`,
    `Pedidos: ${m.totalOrders} (pagos: ${m.paidOrders}, pendentes: ${m.pendingOrders}, falhos/cancelados: ${m.failedOrders})`,
    `Taxa de conversão de pagamento: ${m.conversionRate.toFixed(1)}%`,
    `Receita total (paga): ${brl(m.revenue)}`,
    `Receita últimos 7 dias: ${brl(m.revenue7d)}`,
    `Receita últimos 30 dias: ${brl(m.revenue30d)}`,
    `Ticket médio: ${brl(m.aov)}`,
  ];
  if (m.topProducts.length > 0) {
    lines.push(`Produtos de maior valor: ${m.topProducts.map((p) => `${p.name} (${brl(p.price)})`).join(", ")}`);
  }
  if (m.lowStock.length > 0) {
    lines.push(`Estoque baixo: ${m.lowStock.map((p) => `${p.name} (${p.qty} un.)`).join(", ")}`);
  }
  return lines.join("\n");
}

export type PavoxInsightsResult = {
  isLoading: boolean;
  metrics: PavoxMetrics;
  insights: PavoxInsight[];
};

/** Hook que reúne dados reais da conta e deriva métricas + insights acionáveis. */
export function usePavoxInsights(enabled = true): PavoxInsightsResult {
  const { data: products = [], isLoading: lp } = useProducts(enabled);
  const { data: checkouts = [], isLoading: lc } = useCheckouts(enabled);
  const { data: customers = [], isLoading: lcu } = useCustomers(enabled);
  const { data: orders = [], isLoading: lo } = useOrders(enabled);

  const metrics = useMemo(
    () => computeMetrics(products, checkouts, customers, orders),
    [products, checkouts, customers, orders],
  );
  const insights = useMemo(() => buildInsights(metrics), [metrics]);

  return { isLoading: lp || lc || lcu || lo, metrics, insights };
}

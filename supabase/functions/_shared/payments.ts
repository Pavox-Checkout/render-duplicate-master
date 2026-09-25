// Payment orchestration shared by the public checkout and the webhooks.
// Order state only changes through pavox_apply_payment_status(), always
// after reading the charge server-to-server from the gateway.
import { admin, log } from "./http.ts";
import { gatewayFor } from "./gateways/registry.ts";
import { GatewayError, type PaymentGateway } from "./gateways/types.ts";

type OrderForPayment = {
  id: string;
  user_id: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  gateway: string | null;
  gateway_payment_id: string | null;
  expires_at: string | null;
  buyer: { name: string; email: string; phone: string; document: string; person_type: "pf" | "pj" };
  product: { id: string; name: string; unit_price: number };
  store_name: string;
  provider: string | null;
};

export async function loadGateway(userId: string, provider: string): Promise<PaymentGateway> {
  const { data, error } = await admin.rpc("pavox_get_integration_credentials", {
    p_user_id: userId,
    p_provider: provider,
  });
  const row = data as { environment: string; status: string; credentials: Record<string, string> } | null;
  if (error || !row || !row.credentials?.["access_token"]) {
    throw new GatewayError("invalid_credentials", "Integração não configurada.");
  }
  const gateway = gatewayFor(provider, row.credentials, row.environment);
  if (!gateway) throw new GatewayError("unknown_error", `Gateway ${provider} não suportado.`);
  return gateway;
}

async function orderForPayment(orderId: string): Promise<OrderForPayment | null> {
  const { data, error } = await admin.rpc("pavox_order_for_payment", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return (data ?? null) as OrderForPayment | null;
}

export async function publicOrder(orderId: string) {
  const { data, error } = await admin.rpc("get_public_order", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return data;
}

/** Creates the gateway charge for a pending order (once) and returns the public order. */
export async function chargeOrder(orderId: string) {
  const order = await orderForPayment(orderId);
  if (!order) throw new Error("order_not_found");
  if (order.gateway_payment_id || order.status !== "Pendente") return publicOrder(orderId);
  if (!order.provider) throw new GatewayError("invalid_credentials", "Nenhum gateway conectado para este método.");

  const gateway = await loadGateway(order.user_id, order.provider);
  const expiresAt = order.expires_at ? new Date(order.expires_at) : new Date(Date.now() + 30 * 60 * 1000);
  const pix = await gateway.createPix({
    orderId: order.id,
    reference: order.reference,
    amount: Number(order.amount),
    description: `${order.product.name} — pedido ${order.reference}`,
    buyer: order.buyer,
    product: { id: order.product.id, name: order.product.name, unitPrice: Number(order.product.unit_price) },
    notificationUrl: webhookUrl(order.provider, order.user_id),
    statementDescriptor: order.store_name.slice(0, 22),
    expiresAt,
  });

  log("payment.created", { order_id: order.id, provider: order.provider, gateway_payment_id: pix.paymentId });

  const { data, error } = await admin.rpc("pavox_attach_payment", {
    p_order_id: order.id,
    p_gateway: order.provider,
    p_payment_id: pix.paymentId,
    p_payment_data: {
      method: "pix",
      qr_code: pix.qrCode,
      qr_code_base64: pix.qrCodeBase64,
      ticket_url: pix.ticketUrl,
      expires_at: pix.expiresAt,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Reads the charge from the gateway and applies its state to the order.
 * Safe to call repeatedly: events are deduplicated by (provider, charge id, status).
 */
export async function syncOrder(orderId: string, source: string, payload: Record<string, unknown> = {}) {
  const order = await orderForPayment(orderId);
  if (!order || !order.gateway || !order.gateway_payment_id) return "no_charge";

  const gateway = await loadGateway(order.user_id, order.gateway);
  const info = await gateway.getPayment(order.gateway_payment_id);

  if (info.externalReference && info.externalReference !== order.id) {
    log("webhook.invalid", { order_id: order.id, reason: "external_reference_mismatch", source });
    return "reference_mismatch";
  }

  const { data, error } = await admin.rpc("pavox_apply_payment_status", {
    p_provider: order.gateway,
    p_event_id: `${info.id}:${info.status}`,
    p_event_type: `${source}:${info.rawStatus}`,
    p_user_id: order.user_id,
    p_order_id: order.id,
    p_payment_id: info.id,
    p_status: info.status,
    p_amount: info.amount,
    p_currency: info.currency,
    p_payload: payload,
  });
  if (error) throw new Error(error.message);
  const result = String(data);
  if (result.startsWith("order_")) {
    log(result === "order_aprovado" ? "payment.paid" : "payment.updated", {
      order_id: order.id,
      gateway_payment_id: info.id,
      result,
      source,
    });
  }
  return result;
}

export function webhookUrl(provider: string, userId: string) {
  const slug = provider === "mercadopago" ? "mercadopago-webhook" : `${provider}-webhook`;
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/${slug}?store=${userId}`;
}

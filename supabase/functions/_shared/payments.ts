// Payment orchestration shared by the public checkout and the webhooks.
// Order state only changes through pavox_apply_payment_status(), always
// after reading the charge server-to-server from the gateway.
import { admin, log } from "./http.ts";
import { gatewayFor } from "./gateways/registry.ts";
import {
  GatewayError,
  type Buyer,
  type CardData,
  type ChargeMethod,
  type ChargeResult,
  type PaymentGateway,
} from "./gateways/types.ts";
import {
  needsRefresh,
  oauthConfig,
  oauthCredentials,
  refreshTokens,
  splitFee,
} from "./gateways/mercadopago-oauth.ts";
import { emailConfig, orderEmail, sendEmail } from "./email.ts";

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
  buyer: Buyer;
  product: { id: string; name: string; unit_price: number };
  store_name: string;
  provider: string | null;
  platform_fee_quote: number;
};

type Connection = { gateway: PaymentGateway; credentials: Record<string, string> };

/**
 * Loads the store's gateway. OAuth tokens close to expiring are renewed first;
 * if renewal fails the current (still valid) token keeps being used.
 */
export async function loadConnection(userId: string, provider: string): Promise<Connection> {
  const { data, error } = await admin.rpc("pavox_get_integration_credentials", {
    p_user_id: userId,
    p_provider: provider,
  });
  const row = data as { environment: string; status: string; credentials: Record<string, string> } | null;
  if (error || !row || !row.credentials?.["access_token"]) {
    throw new GatewayError("invalid_credentials", "Integração não configurada.");
  }
  let credentials = row.credentials;
  if (provider === "mercadopago" && needsRefresh(credentials)) {
    credentials = await refreshStoredTokens(userId, provider, credentials);
  }
  const gateway = gatewayFor(provider, credentials, row.environment);
  if (!gateway) throw new GatewayError("unknown_error", `Gateway ${provider} não suportado.`);
  return { gateway, credentials };
}

export async function loadGateway(userId: string, provider: string): Promise<PaymentGateway> {
  return (await loadConnection(userId, provider)).gateway;
}

async function refreshStoredTokens(userId: string, provider: string, credentials: Record<string, string>) {
  const config = oauthConfig();
  if (!config) {
    log("integration.refresh_failed", { store_id: userId, provider, reason: "oauth_not_configured" });
    return credentials;
  }
  try {
    const tokens = await refreshTokens(config, credentials["refresh_token"]!);
    const next = oauthCredentials(tokens);
    const { error } = await admin.rpc("pavox_update_integration_credentials", {
      p_user_id: userId,
      p_provider: provider,
      p_credentials: next,
      p_token_expires_at: tokens.expires_at,
    });
    if (error) throw new Error(error.message);
    log("integration.refreshed", { store_id: userId, provider });
    return next;
  } catch (err) {
    log("integration.refresh_failed", {
      store_id: userId,
      provider,
      detail: err instanceof Error ? err.message : String(err),
    });
    return credentials;
  }
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

const CHARGE_METHODS: ChargeMethod[] = ["pix", "card", "boleto"];

/** What the buyer needs to see to pay (never card data). */
function paymentData(method: ChargeMethod, result: ChargeResult, card?: CardData) {
  if (method === "card") {
    return {
      method,
      status_detail: result.statusDetail,
      brand: card?.paymentMethodId ?? null,
      installments: card?.installments ?? 1,
    };
  }
  if (method === "boleto") {
    return {
      method,
      ticket_url: result.ticketUrl,
      digitable_line: result.digitableLine ?? "",
      barcode: result.barcode ?? "",
      expires_at: result.expiresAt,
    };
  }
  return {
    method,
    qr_code: result.qrCode ?? "",
    qr_code_base64: result.qrCodeBase64 ?? "",
    ticket_url: result.ticketUrl,
    expires_at: result.expiresAt,
  };
}

/**
 * Creates the gateway charge for a pending order (once) and returns the public
 * order. `card` carries the token created in the browser for card payments.
 */
export async function chargeOrder(orderId: string, options: { card?: CardData } = {}) {
  const order = await orderForPayment(orderId);
  if (!order) throw new Error("order_not_found");
  if (order.gateway_payment_id || order.status !== "Pendente") return publicOrder(orderId);
  if (!order.provider) throw new GatewayError("invalid_credentials", "Nenhum gateway conectado para este método.");
  const method = order.payment_method as ChargeMethod;
  if (!CHARGE_METHODS.includes(method)) throw new GatewayError("invalid_request", "Método de pagamento inválido.");
  if (method === "card" && !options.card) throw new GatewayError("invalid_request", "Dados do cartão ausentes.");

  const { gateway, credentials } = await loadConnection(order.user_id, order.provider);
  // Fee fixed at charge time. With OAuth, Mercado Pago retains it (split);
  // otherwise it is recorded for later billing when the order is approved.
  const marketplaceFee = splitFee(credentials, Number(order.platform_fee_quote));
  const expiresAt = order.expires_at ? new Date(order.expires_at) : new Date(Date.now() + 30 * 60 * 1000);
  const result = await gateway.createCharge({
    method,
    ...(options.card ? { card: options.card } : {}),
    orderId: order.id,
    reference: order.reference,
    amount: Number(order.amount),
    description: `${order.product.name} — pedido ${order.reference}`,
    buyer: order.buyer,
    product: { id: order.product.id, name: order.product.name, unitPrice: Number(order.product.unit_price) },
    notificationUrl: webhookUrl(order.provider, order.user_id),
    statementDescriptor: order.store_name.slice(0, 22),
    expiresAt,
    marketplaceFee,
  });

  log("payment.created", {
    order_id: order.id,
    provider: order.provider,
    method,
    gateway_payment_id: result.paymentId,
    status: result.status,
    fee_collection: marketplaceFee ? "split" : "invoice",
  });

  const { data, error } = await admin.rpc("pavox_attach_payment", {
    p_order_id: order.id,
    p_gateway: order.provider,
    p_payment_id: result.paymentId,
    p_payment_data: paymentData(method, result, options.card),
    p_platform_fee: marketplaceFee,
    p_fee_collection: marketplaceFee ? "split" : "invoice",
  });
  if (error) throw new Error(error.message);

  // Cards are decided on the spot: apply approved/rejected now (same path as
  // the webhook, re-read from the gateway) instead of waiting for it.
  if (result.status !== "pending") {
    try {
      await syncOrder(order.id, "charge");
      return publicOrder(order.id);
    } catch (err) {
      log("payment.sync_failed", { order_id: order.id, detail: err instanceof Error ? err.message : String(err) });
    }
  }
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
  // The transition happens once (events are deduplicated), and the e-mail is
  // claimed per order, so the buyer gets exactly one message per state.
  if (result === "order_aprovado") await notifyBuyer(order.id, "paid");
  if (result === "order_reembolsado") await notifyBuyer(order.id, "refunded");
  return result;
}

export type NotifyResult = "sent" | "already_sent" | "not_configured" | "no_email" | "failed";

/**
 * E-mails the buyer about a paid/refunded order. Never throws: a failed e-mail
 * must not undo a payment. `force` re-sends (merchant "Reenviar recibo").
 */
export async function notifyBuyer(
  orderId: string,
  kind: "paid" | "refunded",
  options: { force?: boolean } = {},
): Promise<NotifyResult> {
  const config = emailConfig();
  if (!config) {
    log("email.skipped", { order_id: orderId, kind, reason: "not_configured" });
    return "not_configured";
  }
  try {
    const order = await orderForPayment(orderId);
    const to = order?.buyer?.email ?? "";
    if (!order || !to) return "no_email";

    const { data: claimed, error: claimError } = await admin.rpc("pavox_claim_order_email", {
      p_order_id: orderId,
      p_kind: kind,
      p_force: options.force ?? false,
    });
    if (claimError) throw new Error(claimError.message);
    if (!claimed) return "already_sent";

    const { data: row } = await admin.from("orders").select("payment_data").eq("id", orderId).maybeSingle();
    const installments = Number((row?.payment_data as { installments?: number } | null)?.installments ?? 1);
    const msg = orderEmail({
      kind,
      storeName: order.store_name,
      buyerName: order.buyer.name,
      buyerEmail: to,
      reference: order.reference,
      productName: order.product.name,
      amount: Number(order.amount),
      method: order.payment_method,
      installments,
    });
    try {
      const messageId = await sendEmail(config, { to, toName: order.buyer.name, senderName: order.store_name, ...msg });
      log("email.sent", { order_id: orderId, kind, message_id: messageId });
      return "sent";
    } catch (err) {
      // Let a later attempt (e.g. "Reenviar recibo") try again.
      await admin.rpc("pavox_release_order_email", { p_order_id: orderId, p_kind: kind });
      throw err;
    }
  } catch (err) {
    log("email.failed", { order_id: orderId, kind, detail: err instanceof Error ? err.message : String(err) });
    return "failed";
  }
}

/** Full refund of an approved order that belongs to `userId`. */
export async function refundOrder(orderId: string, userId: string) {
  const order = await orderForPayment(orderId);
  if (!order || order.user_id !== userId) throw new GatewayError("invalid_request", "order_not_found");
  if (order.status === "Reembolsado") return publicOrder(orderId);
  if (order.status !== "Aprovado" || !order.gateway || !order.gateway_payment_id) {
    throw new GatewayError("invalid_request", "order_not_refundable");
  }
  const gateway = await loadGateway(order.user_id, order.gateway);
  const result = await gateway.refund(order.gateway_payment_id);
  log("payment.refund_requested", { order_id: orderId, gateway_payment_id: order.gateway_payment_id, status: result.status });
  // Re-read from the gateway and apply (same path as the webhook).
  await syncOrder(orderId, "refund");
  return publicOrder(orderId);
}

export function webhookUrl(provider: string, userId: string) {
  const slug = provider === "mercadopago" ? "mercadopago-webhook" : `${provider}-webhook`;
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/${slug}?store=${userId}`;
}

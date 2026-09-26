// Mercado Pago adapter — Checkout API via Orders (POST /v1/orders).
// The "Order ID" returned here is what Mercado Pago's integration quality
// check asks for.
import {
  GatewayError,
  type ConnectionResult,
  type NormalizedPaymentStatus,
  type PaymentGateway,
  type PaymentInfo,
  type Address,
  type ChargeInput,
  type ChargeMethod,
  type ChargeResult,
} from "./types.ts";

const API = "https://api.mercadopago.com";
const TIMEOUT_MS = 15_000;

export type MercadoPagoCredentials = { access_token: string; public_key?: string };

type MpOrder = {
  id?: string;
  status?: string;
  status_detail?: string;
  total_amount?: string | number;
  currency?: string;
  external_reference?: string;
  transactions?: {
    payments?: Array<{
      id?: string;
      status?: string;
      status_detail?: string;
      date_of_expiration?: string;
      expiration_time?: string;
      payment_method?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
        digitable_line?: string;
        barcode_content?: string;
      };
    }>;
  };
  errors?: Array<{ code?: string; message?: string; details?: string[] }>;
  message?: string;
};

function connectionStatusFor(httpStatus: number): ConnectionResult["status"] {
  if (httpStatus === 401) return "invalid_credentials";
  if (httpStatus === 403) return "permission_error";
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus >= 500) return "gateway_unavailable";
  return "unknown_error";
}

// Orders statuses → internal. "processed" is the only paid state.
function normalize(status: string | undefined): NormalizedPaymentStatus {
  switch (status) {
    case "processed":
      return "approved";
    case "failed":
      return "rejected";
    case "canceled":
    case "cancelled":
      return "cancelled";
    case "expired":
      return "expired";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending"; // created, processing, action_required, at_terminal
  }
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  const first = parts.shift() ?? "";
  return { first, last: parts.join(" ") || first };
}

function money(value: number): string {
  return value.toFixed(2);
}

// Mercado Pago rejects a reused X-Idempotency-Key whose body differs, so the
// key is bound to the exact request: a retry of the same charge reuses it,
// a corrected request gets a new one.
async function idempotencyKey(orderId: string, body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${orderId}:${body}`));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${orderId}-${hex.slice(0, 16)}`;
}

function paymentNode(method: ChargeMethod, input: ChargeInput) {
  const amount = money(input.amount);
  if (method === "card") {
    const card = input.card!;
    return {
      amount,
      payment_method: {
        id: card.paymentMethodId,
        type: card.paymentTypeId,
        token: card.token,
        installments: card.installments,
      },
    };
  }
  if (method === "boleto") {
    // 3 business days is Mercado Pago's recommended minimum for boleto.
    return { amount, payment_method: { id: "boleto", type: "ticket" }, expiration_time: "P3D" };
  }
  // Fixed (not "time left") so retries send an identical body.
  return { amount, payment_method: { id: "pix", type: "bank_transfer" }, expiration_time: "PT30M" };
}

export class MercadoPagoGateway implements PaymentGateway {
  constructor(
    private readonly credentials: MercadoPagoCredentials,
    private readonly environment: "sandbox" | "production",
  ) {}

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(`${API}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.credentials.access_token}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw new GatewayError("gateway_unavailable", "Mercado Pago não respondeu.");
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(): Promise<ConnectionResult> {
    const token = this.credentials.access_token ?? "";
    if (this.environment === "production" && token.startsWith("TEST-")) {
      return { status: "environment_mismatch" };
    }
    let res: Response;
    try {
      res = await this.request("/users/me");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (!res.ok) return { status: connectionStatusFor(res.status) };
    const me = (await res.json()) as { id?: number; nickname?: string; site_id?: string };
    if (me.site_id && me.site_id !== "MLB") return { status: "permission_error" };
    return { status: "connected", accountLabel: me.nickname ?? (me.id ? String(me.id) : "") };
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    const { first, last } = splitName(input.buyer.name);
    const doc = input.buyer.document.replace(/\D/g, "");
    const phone = input.buyer.phone.replace(/\D/g, "");
    const address = (input.buyer.address ?? {}) as Partial<Address>;
    // Card: identification typed in the gateway's card form wins over the checkout field.
    const identification =
      method === "card" && input.card?.identification?.number
        ? { type: input.card.identification.type, number: input.card.identification.number.replace(/\D/g, "") }
        : doc.length === 11 || doc.length === 14
          ? { type: doc.length === 11 ? "CPF" : "CNPJ", number: doc }
          : null;

    if (method === "card" && !input.card?.token) {
      throw new GatewayError("invalid_request", "Dados do cartão ausentes.");
    }

    const body = {
      type: "online",
      processing_mode: "automatic",
      external_reference: input.orderId,
      total_amount: money(input.amount),
      description: input.description.slice(0, 250),
      ...(input.marketplaceFee ? { marketplace_fee: money(input.marketplaceFee) } : {}),
      transactions: { payments: [paymentNode(method, input)] },
      payer: {
        email: input.buyer.email,
        first_name: first,
        last_name: last,
        ...(identification ? { identification } : {}),
        ...(phone.length >= 10 ? { phone: { area_code: phone.slice(0, 2), number: phone.slice(2) } } : {}),
        ...(method === "boleto"
          ? {
              address: {
                zip_code: (address.zip ?? "").replace(/\D/g, ""),
                street_name: address.street ?? "",
                street_number: address.number || "S/N",
                neighborhood: address.neighborhood ?? "",
                city: address.city ?? "",
                state: address.state ?? "",
              },
            }
          : {}),
      },
      items: [
        {
          title: input.product.name.slice(0, 150),
          unit_price: money(input.product.unitPrice),
          quantity: 1,
          // Mercado Pago caps external_code at 30 chars; a UUID has 36.
          external_code: input.product.id.replace(/-/g, "").slice(0, 30),
          description: input.description.slice(0, 250),
          category_id: "others",
        },
      ],
    };

    const payload = JSON.stringify(body);
    const res = await this.request("/v1/orders", {
      method: "POST",
      headers: { "X-Idempotency-Key": await idempotencyKey(input.orderId, payload) },
      body: payload,
    });
    const data = (await res.json().catch(() => ({}))) as MpOrder;

    // A declined card can still come back as an order (status "failed"): that
    // is a result, not an error.
    const isOrder = Boolean(data.id && data.transactions?.payments?.length);
    if (!res.ok && !isOrder) {
      const mpError = data.errors?.[0];
      const detail =
        [mpError?.code, mpError?.message ?? data.message, ...(mpError?.details ?? [])]
          .filter(Boolean)
          .join(" | ") || `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) {
        throw new GatewayError(connectionStatusFor(res.status), detail, res.status);
      }
      throw new GatewayError("payment_rejected", detail, res.status);
    }

    const payment = data.transactions?.payments?.[0];
    const pm = payment?.payment_method ?? {};
    if (!data.id) throw new GatewayError("unknown_error", "Resposta do Mercado Pago sem ID da order.");
    if (method === "pix" && !pm.qr_code) {
      throw new GatewayError("unknown_error", "Resposta do Mercado Pago sem QR Code Pix.");
    }
    if (method === "boleto" && !pm.ticket_url && !pm.digitable_line) {
      throw new GatewayError("unknown_error", "Resposta do Mercado Pago sem boleto.");
    }

    return {
      paymentId: data.id,
      status: normalize(data.status),
      statusDetail: payment?.status_detail ?? data.status_detail ?? "",
      ticketUrl: pm.ticket_url ?? null,
      expiresAt:
        payment?.date_of_expiration ?? (method === "card" ? null : input.expiresAt.toISOString()),
      ...(method === "pix" ? { qrCode: pm.qr_code ?? "", qrCodeBase64: pm.qr_code_base64 ?? "" } : {}),
      ...(method === "boleto"
        ? { digitableLine: pm.digitable_line ?? "", barcode: pm.barcode_content ?? "" }
        : {}),
    };
  }

  async refund(orderId: string): Promise<{ status: NormalizedPaymentStatus }> {
    // Empty body = full refund. Same order → same key, so a retry never refunds twice.
    const res = await this.request(`/v1/orders/${encodeURIComponent(orderId)}/refund`, {
      method: "POST",
      headers: { "X-Idempotency-Key": `refund-${orderId}` },
    });
    const data = (await res.json().catch(() => ({}))) as MpOrder;
    if (!res.ok) {
      const mpError = data.errors?.[0];
      const detail =
        [mpError?.code, mpError?.message ?? data.message, ...(mpError?.details ?? [])]
          .filter(Boolean)
          .join(" | ") || `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) {
        throw new GatewayError(connectionStatusFor(res.status), detail, res.status);
      }
      throw new GatewayError("payment_rejected", detail, res.status);
    }
    return { status: normalize(data.status) };
  }

  async getPayment(orderId: string): Promise<PaymentInfo> {
    const res = await this.request(`/v1/orders/${encodeURIComponent(orderId)}`);
    if (!res.ok) {
      throw new GatewayError(connectionStatusFor(res.status), `HTTP ${res.status}`, res.status);
    }
    const data = (await res.json()) as MpOrder;
    return {
      id: data.id ?? orderId,
      status: normalize(data.status),
      rawStatus: `${data.status ?? ""}/${data.status_detail ?? ""}`,
      amount: Number(data.total_amount ?? NaN),
      currency: (data.currency ?? "BRL").toUpperCase(),
      externalReference: data.external_reference ?? null,
    };
  }
}

// Stripe adapter — PaymentIntents with Pix and boleto (Brazilian accounts).
//
// Reference: the official stripe-node SDK types (PaymentIntent.next_action.
// pix_display_qr_code / boleto_display_details). Form-encoded API,
// Authorization: Bearer sk_live_…|sk_test_…, amounts in centavos,
// Idempotency-Key on writes. On connect PAVOX registers its webhook endpoint
// on the merchant's account (like Asaas), so there is nothing to configure.
import {
  GatewayError,
  type Address,
  type ChargeInput,
  type ChargeResult,
  type ConnectionResult,
  type NormalizedPaymentStatus,
  type PaymentGateway,
  type PaymentInfo,
} from "./types.ts";
import { connectionStatusFor, errorMessage, failure, onlyDigits, requestJson } from "./http-json.ts";

const API = "https://api.stripe.com/v1";

export type StripeCredentials = { secret_key: string };

export const STRIPE_WEBHOOK_EVENTS = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.refunded",
];

type StripeIntent = {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, string>;
  latest_charge?: string | { refunded?: boolean; amount_refunded?: number } | null;
  last_payment_error?: { message?: string } | null;
  next_action?: {
    pix_display_qr_code?: { data?: string; expires_at?: number; hosted_instructions_url?: string };
    boleto_display_details?: {
      number?: string | null;
      pdf?: string | null;
      hosted_voucher_url?: string | null;
      expires_at?: number | null;
    };
  } | null;
};

/** Stripe's bracket notation for nested form fields. */
export function formEncode(value: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined || raw === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(raw)) {
      raw.forEach((item, i) => {
        if (item && typeof item === "object") parts.push(formEncode(item as Record<string, unknown>, `${name}[${i}]`));
        else parts.push(`${encodeURIComponent(`${name}[${i}]`)}=${encodeURIComponent(String(item))}`);
      });
    } else if (typeof raw === "object") {
      parts.push(formEncode(raw as Record<string, unknown>, name));
    } else {
      parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(raw))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

export function normalize(intent: StripeIntent): NormalizedPaymentStatus {
  const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
  switch (intent.status) {
    case "succeeded":
      return charge?.refunded ? "refunded" : "approved";
    case "canceled":
      return "cancelled";
    case "requires_payment_method":
      // Back to this state after a failed attempt or an expired Pix/boleto.
      return intent.next_action ? "pending" : "rejected";
    default:
      return "pending"; // requires_action, processing, requires_confirmation
  }
}

/** PaymentIntent id from a Stripe event (payment_intent.* or charge.*). */
export function webhookIntentId(body: Record<string, unknown>): string | null {
  const data = (body["data"] && typeof body["data"] === "object" ? body["data"] : {}) as Record<string, unknown>;
  const object = (data["object"] && typeof data["object"] === "object" ? data["object"] : {}) as Record<string, unknown>;
  const id = object["object"] === "charge" ? object["payment_intent"] : object["id"];
  return typeof id === "string" && id.startsWith("pi_") ? id : null;
}

export class StripeGateway implements PaymentGateway {
  constructor(
    private readonly credentials: StripeCredentials,
    private readonly environment: "sandbox" | "production",
  ) {}

  private request<T>(path: string, init: { method?: string; form?: Record<string, unknown>; idempotencyKey?: string } = {}) {
    return requestJson<T & { error?: { message?: string } }>("Stripe", `${API}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${this.credentials.secret_key}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      },
      ...(init.form ? { body: formEncode(init.form) } : {}),
    });
  }

  async testConnection(): Promise<ConnectionResult> {
    const key = this.credentials.secret_key ?? "";
    if (this.environment === "production" && key.startsWith("sk_test_")) return { status: "environment_mismatch" };
    let res;
    try {
      res = await this.request<{ settings?: { dashboard?: { display_name?: string } }; email?: string }>("/account");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (!res.ok) return { status: connectionStatusFor(res.status) };
    return { status: "connected", accountLabel: res.data.settings?.dashboard?.display_name || res.data.email || "" };
  }

  /** Creates (or updates) the PAVOX webhook endpoint on the merchant's account. */
  async ensureWebhook(url: string): Promise<void> {
    const list = await this.request<{ data?: Array<{ id?: string; url?: string }> }>("/webhook_endpoints?limit=100");
    if (!list.ok) throw failure(list.status, errorMessage(list.data, list.status));
    const existing = list.data.data?.find((w) => w.url === url);
    const form = { enabled_events: STRIPE_WEBHOOK_EVENTS, description: "PAVOX" };
    const res = existing?.id
      ? await this.request(`/webhook_endpoints/${encodeURIComponent(existing.id)}`, { method: "POST", form })
      : await this.request("/webhook_endpoints", { method: "POST", form: { url, ...form } });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method === "card") {
      throw new GatewayError("invalid_request", "Cartão ainda não é processado pelo Stripe na PAVOX.");
    }
    const doc = onlyDigits(input.buyer.document);
    if (doc.length !== 11 && doc.length !== 14) {
      throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    }
    const address = (input.buyer.address ?? {}) as Partial<Address>;
    const billing = {
      name: input.buyer.name.slice(0, 200),
      email: input.buyer.email,
      ...(method === "boleto"
        ? {
            address: {
              line1: `${address.street ?? ""}, ${address.number || "S/N"}`.slice(0, 200),
              line2: [address.complement, address.neighborhood].filter(Boolean).join(" - ").slice(0, 200) || undefined,
              city: address.city ?? "",
              state: address.state ?? "",
              postal_code: onlyDigits(address.zip ?? ""),
              country: "BR",
            },
          }
        : {}),
    };
    const seconds = Math.min(1_209_600, Math.max(60, Math.round((input.expiresAt.getTime() - Date.now()) / 1000)));

    const res = await this.request<StripeIntent>("/payment_intents", {
      method: "POST",
      idempotencyKey: `pavox-${input.orderId}-${method}`,
      form: {
        amount: Math.round(input.amount * 100),
        currency: "brl",
        confirm: true,
        description: input.description.slice(0, 500),
        payment_method_types: [method],
        payment_method_data:
          method === "boleto"
            ? { type: "boleto", boleto: { tax_id: doc }, billing_details: billing }
            : { type: "pix", billing_details: billing },
        payment_method_options:
          method === "boleto" ? { boleto: { expires_after_days: 3 } } : { pix: { expires_after_seconds: seconds } },
        metadata: { order_id: input.orderId, reference: input.reference },
      },
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    const intent = res.data;
    if (!intent.id) throw new GatewayError("unknown_error", "Resposta do Stripe sem ID do pagamento.");

    if (method === "boleto") {
      const boleto = intent.next_action?.boleto_display_details;
      if (!boleto?.number && !boleto?.hosted_voucher_url) {
        throw new GatewayError("unknown_error", intent.last_payment_error?.message || "Resposta do Stripe sem boleto.");
      }
      return {
        paymentId: intent.id,
        status: normalize(intent),
        statusDetail: intent.status ?? "",
        ticketUrl: boleto.pdf ?? boleto.hosted_voucher_url ?? null,
        expiresAt: boleto.expires_at ? new Date(boleto.expires_at * 1000).toISOString() : null,
        digitableLine: boleto.number ?? "",
        barcode: "",
      };
    }
    const pix = intent.next_action?.pix_display_qr_code;
    if (!pix?.data) {
      throw new GatewayError("unknown_error", intent.last_payment_error?.message || "Resposta do Stripe sem QR Code Pix.");
    }
    return {
      paymentId: intent.id,
      status: normalize(intent),
      statusDetail: intent.status ?? "",
      ticketUrl: pix.hosted_instructions_url ?? null,
      expiresAt: pix.expires_at ? new Date(pix.expires_at * 1000).toISOString() : input.expiresAt.toISOString(),
      qrCode: pix.data,
      qrCodeBase64: "",
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const res = await this.request<StripeIntent>(
      `/payment_intents/${encodeURIComponent(paymentId)}?expand[]=latest_charge`,
    );
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    const intent = res.data;
    return {
      id: intent.id ?? paymentId,
      status: normalize(intent),
      rawStatus: intent.status ?? "",
      amount: typeof intent.amount === "number" ? intent.amount / 100 : NaN,
      currency: (intent.currency ?? "brl").toUpperCase(),
      externalReference: intent.metadata?.["order_id"] ?? null,
    };
  }

  async refund(paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    const res = await this.request<{ status?: string; failure_reason?: string }>("/refunds", {
      method: "POST",
      idempotencyKey: `pavox-refund-${paymentId}`,
      form: { payment_intent: paymentId },
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    if (res.data.status === "failed" || res.data.status === "canceled") {
      throw new GatewayError("payment_rejected", res.data.failure_reason || "O Stripe recusou o reembolso.");
    }
    return { status: res.data.status === "succeeded" ? "refunded" : "pending" };
  }
}

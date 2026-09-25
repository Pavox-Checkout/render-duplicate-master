// Mercado Pago adapter — Checkout API via Orders (POST /v1/orders).
// The "Order ID" returned here is what Mercado Pago's integration quality
// check asks for.
import {
  GatewayError,
  type ConnectionResult,
  type NormalizedPaymentStatus,
  type PaymentGateway,
  type PaymentInfo,
  type PixInput,
  type PixResult,
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
      payment_method?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
    }>;
  };
  errors?: Array<{ code?: string; message?: string }>;
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

  async createPix(input: PixInput): Promise<PixResult> {
    const { first, last } = splitName(input.buyer.name);
    const doc = input.buyer.document.replace(/\D/g, "");
    const phone = input.buyer.phone.replace(/\D/g, "");
    const minutes = Math.max(5, Math.round((input.expiresAt.getTime() - Date.now()) / 60000));

    const body = {
      type: "online",
      processing_mode: "automatic",
      external_reference: input.orderId,
      total_amount: money(input.amount),
      description: input.description.slice(0, 250),
      transactions: {
        payments: [
          {
            amount: money(input.amount),
            payment_method: { id: "pix", type: "bank_transfer" },
            expiration_time: `PT${minutes}M`,
          },
        ],
      },
      payer: {
        email: input.buyer.email,
        first_name: first,
        last_name: last,
        ...(doc.length === 11 || doc.length === 14
          ? { identification: { type: doc.length === 11 ? "CPF" : "CNPJ", number: doc } }
          : {}),
        ...(phone.length >= 10 ? { phone: { area_code: phone.slice(0, 2), number: phone.slice(2) } } : {}),
      },
      items: [
        {
          title: input.product.name.slice(0, 150),
          unit_price: money(input.product.unitPrice),
          quantity: 1,
          external_code: input.product.id,
          description: input.description.slice(0, 250),
          category_id: "others",
        },
      ],
    };

    const res = await this.request("/v1/orders", {
      method: "POST",
      // Same order → same key: a network retry never creates a second charge.
      headers: { "X-Idempotency-Key": input.orderId },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as MpOrder;

    if (!res.ok) {
      const detail = data.errors?.[0]?.message ?? data.message ?? `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) {
        throw new GatewayError(connectionStatusFor(res.status), detail, res.status);
      }
      throw new GatewayError("payment_rejected", detail, res.status);
    }

    const payment = data.transactions?.payments?.[0];
    const method = payment?.payment_method ?? {};
    if (!data.id || !method.qr_code) {
      throw new GatewayError("unknown_error", "Resposta do Mercado Pago sem QR Code Pix.");
    }

    return {
      paymentId: data.id,
      status: normalize(data.status),
      qrCode: method.qr_code,
      qrCodeBase64: method.qr_code_base64 ?? "",
      ticketUrl: method.ticket_url ?? null,
      expiresAt: payment?.date_of_expiration ?? input.expiresAt.toISOString(),
    };
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

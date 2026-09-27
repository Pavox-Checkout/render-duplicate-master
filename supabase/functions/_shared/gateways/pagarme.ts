// Pagar.me adapter — API v5 (Pix and boleto).
//
// Reference: the official @pagarme/pagarme-nodejs-sdk (models generated from
// the v5 spec): POST /orders, GET /orders/{id}, DELETE /charges/{id} (cancel =
// refund when paid). Authorization: Basic base64("<secret key>:"), amounts in
// centavos, `idempotency-key` header on writes.
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

const API = "https://api.pagar.me/core/v5";

export type PagarmeCredentials = { secret_key: string };

type PagarmeTransaction = {
  status?: string;
  qr_code?: string;
  qr_code_url?: string;
  expires_at?: string;
  url?: string;
  pdf?: string;
  line?: string;
  barcode?: string;
  due_at?: string;
  gateway_response?: { errors?: Array<{ message?: string }> } | null;
};

type PagarmeCharge = {
  id?: string;
  status?: string;
  amount?: number;
  paid_at?: string | null;
  paid_amount?: number | null;
  last_transaction?: PagarmeTransaction | null;
};

type PagarmeOrder = {
  id?: string;
  code?: string;
  status?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, string> | null;
  charges?: PagarmeCharge[];
};

export function normalize(order: PagarmeOrder): NormalizedPaymentStatus {
  const charge = order.charges?.[0];
  switch (charge?.status ?? order.status) {
    case "paid":
    case "overpaid":
      return "approved";
    case "failed":
      return "rejected";
    case "chargedback":
      return "refunded";
    case "canceled":
      // Cancelling a paid charge refunds it.
      return charge?.paid_at || (charge?.paid_amount ?? 0) > 0 ? "refunded" : "cancelled";
    default:
      return "pending"; // pending, processing, underpaid, partial_canceled…
  }
}

/** Order id from a webhook (`order.*` → data.id; `charge.*` → data.order.id). */
export function webhookOrderId(body: Record<string, unknown>): string | null {
  const data = (body["data"] && typeof body["data"] === "object" ? body["data"] : {}) as Record<string, unknown>;
  const order = (data["order"] && typeof data["order"] === "object" ? data["order"] : {}) as Record<string, unknown>;
  for (const id of [data["id"], order["id"]]) {
    if (typeof id === "string" && id.startsWith("or_")) return id;
  }
  return null;
}

function failedReason(order: PagarmeOrder): string {
  const errors = order.charges?.[0]?.last_transaction?.gateway_response?.errors ?? [];
  return errors.map((e) => e.message).filter(Boolean).join(" | ") || "A Pagar.me recusou a cobrança.";
}

export class PagarmeGateway implements PaymentGateway {
  constructor(
    private readonly credentials: PagarmeCredentials,
    private readonly environment: "sandbox" | "production",
  ) {}

  private request<T>(path: string, init: RequestInit = {}) {
    return requestJson<T>("Pagar.me", `${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Basic ${btoa(`${this.credentials.secret_key}:`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  }

  private async fetchOrder(id: string): Promise<PagarmeOrder> {
    const res = await this.request<PagarmeOrder>(`/orders/${encodeURIComponent(id)}`);
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    return res.data;
  }

  async testConnection(): Promise<ConnectionResult> {
    const key = this.credentials.secret_key ?? "";
    if (this.environment === "production" && key.startsWith("sk_test_")) return { status: "environment_mismatch" };
    let res;
    try {
      res = await this.request("/orders?page=1&size=1");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (!res.ok) return { status: connectionStatusFor(res.status) };
    return { status: "connected" };
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method === "card") {
      throw new GatewayError("invalid_request", "Cartão ainda não é processado pela Pagar.me na PAVOX.");
    }
    const doc = onlyDigits(input.buyer.document);
    const phone = onlyDigits(input.buyer.phone).replace(/^55(?=\d{10,11}$)/, "");
    if (doc.length !== 11 && doc.length !== 14) {
      throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    }
    if (phone.length < 10) throw new GatewayError("invalid_request", "Telefone do comprador ausente.");
    const address = (input.buyer.address ?? {}) as Partial<Address>;
    const cents = Math.round(input.amount * 100);
    const seconds = Math.max(60, Math.round((input.expiresAt.getTime() - Date.now()) / 1000));

    const res = await this.request<PagarmeOrder>("/orders", {
      method: "POST",
      headers: { "idempotency-key": `pavox-${input.orderId}-${method}` },
      body: JSON.stringify({
        code: input.orderId,
        items: [
          {
            amount: cents,
            description: input.product.name.slice(0, 250),
            quantity: 1,
            code: input.product.id.slice(0, 52),
          },
        ],
        customer: {
          name: input.buyer.name.slice(0, 64),
          email: input.buyer.email,
          document: doc,
          document_type: doc.length === 11 ? "CPF" : "CNPJ",
          type: doc.length === 11 ? "individual" : "company",
          phones: { mobile_phone: { country_code: "55", area_code: phone.slice(0, 2), number: phone.slice(2) } },
          ...(address.zip
            ? {
                address: {
                  line_1: `${address.number || "S/N"}, ${address.street ?? ""}, ${address.neighborhood ?? ""}`.slice(0, 256),
                  line_2: (address.complement ?? "").slice(0, 128),
                  zip_code: onlyDigits(address.zip),
                  city: address.city ?? "",
                  state: address.state ?? "",
                  country: "BR",
                },
              }
            : {}),
        },
        payments: [
          method === "boleto"
            ? {
                payment_method: "boleto",
                boleto: {
                  instructions: "Pagável em qualquer banco até o vencimento.",
                  due_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
                },
              }
            : { payment_method: "pix", pix: { expires_in: seconds } },
        ],
        metadata: { order_id: input.orderId, reference: input.reference },
      }),
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    const order = res.data;
    if (!order.id) throw new GatewayError("unknown_error", "Resposta da Pagar.me sem ID do pedido.");
    const status = normalize(order);
    if (status === "rejected") throw new GatewayError("payment_rejected", failedReason(order));
    const tx = order.charges?.[0]?.last_transaction ?? {};

    if (method === "boleto") {
      if (!tx.line && !tx.pdf && !tx.url) throw new GatewayError("unknown_error", "Resposta da Pagar.me sem boleto.");
      return {
        paymentId: order.id,
        status,
        statusDetail: order.status ?? "",
        ticketUrl: tx.pdf ?? tx.url ?? null,
        expiresAt: tx.due_at ?? null,
        digitableLine: tx.line ?? "",
        barcode: tx.barcode ?? "",
      };
    }
    if (!tx.qr_code) throw new GatewayError("unknown_error", "Resposta da Pagar.me sem QR Code Pix.");
    return {
      paymentId: order.id,
      status,
      statusDetail: order.status ?? "",
      ticketUrl: null,
      expiresAt: tx.expires_at ?? input.expiresAt.toISOString(),
      qrCode: tx.qr_code,
      // qr_code_url is an image link, not base64: the checkout draws the QR itself.
      qrCodeBase64: "",
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const order = await this.fetchOrder(paymentId);
    return {
      id: order.id ?? paymentId,
      status: normalize(order),
      rawStatus: `${order.status ?? ""}/${order.charges?.[0]?.status ?? ""}`,
      amount: typeof order.amount === "number" ? order.amount / 100 : NaN,
      currency: (order.currency ?? "BRL").toUpperCase(),
      externalReference: order.metadata?.["order_id"] ?? order.code ?? null,
    };
  }

  async refund(paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    const order = await this.fetchOrder(paymentId);
    const chargeId = order.charges?.[0]?.id;
    if (!chargeId) throw new GatewayError("invalid_request", "Cobrança não encontrada na Pagar.me.");
    const res = await this.request<PagarmeCharge>(`/charges/${encodeURIComponent(chargeId)}`, {
      method: "DELETE",
      headers: { "idempotency-key": `pavox-refund-${chargeId}` },
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    return { status: res.data.status === "canceled" ? "refunded" : "pending" };
  }
}

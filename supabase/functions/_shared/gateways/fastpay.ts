// FastPay adapter — Pix.
//
// Reference: FastPay's official documentation repository
// (github.com/FastSoftBrasil/docs, OpenAPI + guides):
//   POST /v1/charges, GET /v1/charges (list), POST /v1/refunds
//   Authorization: Basic base64("<secret key>:"); amounts in reais.
//   Sandbox and production share the host and differ by API key.
// The guide says to confirm a charge with GET /v1/charges/{id}, which the
// OpenAPI file does not list; when that route is not available the charge is
// looked up in the documented list instead.
import {
  GatewayError,
  type ChargeInput,
  type ChargeResult,
  type ConnectionResult,
  type NormalizedPaymentStatus,
  type PaymentGateway,
  type PaymentInfo,
} from "./types.ts";
import { connectionStatusFor, errorMessage, failure, onlyDigits, requestJson } from "./http-json.ts";

const API = "https://api-global.fastpaybrasil.com";
const LIST_PAGE_SIZE = 100;
const LIST_MAX_PAGES = 5;

export type FastPayCredentials = { secret_key: string };

type FastPayCharge = {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown> | null;
  paymentDetails?: { copyPaste?: string; endToEndId?: string } | null;
  reason?: string | null;
};

export function normalize(status: string | undefined): NormalizedPaymentStatus {
  switch (status) {
    case "paid":
      return "approved";
    case "refused":
    case "failed":
      return "rejected";
    case "refunded":
    case "chargeback":
      return "refunded";
    default:
      // pending, in_analysis, authentication_required, pre_chargeback (still paid, disputed)
      return status === "pre_chargeback" ? "approved" : "pending";
  }
}

/** Charge id from a webhook (`{ event, data: { id } }`, snake or camel case). */
export function webhookChargeId(body: Record<string, unknown>): string | null {
  const data = (body["data"] && typeof body["data"] === "object" ? body["data"] : {}) as Record<string, unknown>;
  const id = data["id"];
  return typeof id === "string" && /^[A-Za-z0-9_-]{6,64}$/.test(id) ? id : null;
}

export class FastPayGateway implements PaymentGateway {
  constructor(private readonly credentials: FastPayCredentials) {}

  private request<T>(path: string, init: RequestInit = {}) {
    return requestJson<T>("FastPay", `${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Basic ${btoa(`${this.credentials.secret_key}:`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  }

  async testConnection(): Promise<ConnectionResult> {
    let res;
    try {
      res = await this.request("/v1/charges?page=1&size=1");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (!res.ok) return { status: connectionStatusFor(res.status) };
    return { status: "connected" };
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method !== "pix") {
      throw new GatewayError("invalid_request", "A FastPay processa só Pix na PAVOX.");
    }
    const doc = onlyDigits(input.buyer.document);
    if (doc.length !== 11 && doc.length !== 14) {
      throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    }
    const phone = onlyDigits(input.buyer.phone);
    const amount = Number(input.amount.toFixed(2));
    const seconds = Math.max(900, Math.round((input.expiresAt.getTime() - Date.now()) / 1000));

    const res = await this.request<FastPayCharge>("/v1/charges", {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency: "BRL",
        customer: {
          name: input.buyer.name.slice(0, 200),
          email: input.buyer.email,
          ...(phone.length >= 10 ? { phone: `+55${phone.slice(-11)}` } : {}),
          document: { type: doc.length === 11 ? "cpf" : "cnpj", id: doc },
          address: { country: "BRA" },
        },
        paymentMethod: { type: "pix", expirationInSeconds: seconds },
        items: [
          {
            title: input.product.name.slice(0, 100),
            type: "digital",
            description: input.description.slice(0, 200),
            unit_price: amount,
            quantity: 1,
          },
        ],
        metadata: { order_id: input.orderId, reference: input.reference },
        postbackUrl: input.notificationUrl,
      }),
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    const charge = res.data;
    if (!charge.id) throw new GatewayError("unknown_error", "Resposta da FastPay sem ID da cobrança.");
    const status = normalize(charge.status);
    if (status === "rejected") {
      throw new GatewayError("payment_rejected", charge.reason || "A FastPay recusou a cobrança.");
    }
    if (!charge.paymentDetails?.copyPaste) {
      throw new GatewayError("unknown_error", "Resposta da FastPay sem QR Code Pix.");
    }
    return {
      paymentId: charge.id,
      status,
      statusDetail: charge.status ?? "",
      ticketUrl: null,
      expiresAt: new Date(Date.now() + seconds * 1000).toISOString(),
      qrCode: charge.paymentDetails.copyPaste,
      qrCodeBase64: "",
    };
  }

  private async findCharge(id: string): Promise<FastPayCharge> {
    const direct = await this.request<FastPayCharge & { data?: FastPayCharge }>(`/v1/charges/${encodeURIComponent(id)}`);
    if (direct.ok) {
      const charge = direct.data.data ?? direct.data;
      if (charge.id === id) return charge;
    } else if (direct.status !== 404 && direct.status !== 405) {
      throw failure(direct.status, errorMessage(direct.data, direct.status));
    }
    for (let page = 1; page <= LIST_MAX_PAGES; page++) {
      const res = await this.request<{ data?: FastPayCharge[] }>(
        `/v1/charges?page=${page}&size=${LIST_PAGE_SIZE}&orderBy=-createdAt`,
      );
      if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
      const list = res.data.data ?? [];
      const found = list.find((c) => c.id === id);
      if (found) return found;
      if (list.length < LIST_PAGE_SIZE) break;
    }
    throw new GatewayError("invalid_request", "Cobrança não encontrada na FastPay.", 404);
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const charge = await this.findCharge(paymentId);
    const orderId = charge.metadata?.["order_id"];
    return {
      id: charge.id ?? paymentId,
      status: normalize(charge.status),
      rawStatus: charge.status ?? "",
      amount: typeof charge.amount === "number" ? charge.amount : NaN,
      currency: (charge.currency ?? "BRL").toUpperCase(),
      externalReference: typeof orderId === "string" ? orderId : null,
    };
  }

  async refund(paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    const res = await this.request<{ status?: string; reason?: string | null }>("/v1/refunds", {
      method: "POST",
      body: JSON.stringify({ chargeId: paymentId, reason: "Solicitado pelo lojista na PAVOX" }),
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    if (res.data.status === "refused" || res.data.status === "failed") {
      throw new GatewayError("payment_rejected", res.data.reason || "A FastPay recusou o reembolso.");
    }
    return { status: res.data.status === "refunded" ? "refunded" : "pending" };
  }
}

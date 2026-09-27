// Blackcat adapter — Pix.
//
// No public SDK. Contract taken from open-source integrations in production
// that follow Blackcat's documentation (docs.blackcatoficial.com):
//   POST /api/sales/create-sale → 201 { data: { transactionId, status: "PENDING",
//        amount (centavos), paymentData: { qrCode, copyPaste, qrCodeBase64, expiresAt } } }
//   GET  /api/sales/{transactionId}/status → { success, data: { status, amount } }
//   Header X-API-Key; statuses PENDING, PAID, CANCELLED, REFUNDED, EXPIRED.
// Refunds are not in the public API: they are done in the Blackcat dashboard.
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

const API = "https://api.blackcatoficial.com/api";

export type BlackcatCredentials = { api_key: string };

type BlackcatSale = {
  transactionId?: string;
  status?: string;
  amount?: number;
  externalRef?: string | null;
  paymentData?: { qrCode?: string; copyPaste?: string; qrCodeBase64?: string | null; expiresAt?: string } | null;
};

export function normalize(status: string | undefined): NormalizedPaymentStatus {
  switch (status) {
    case "PAID":
      return "approved";
    case "CANCELLED":
      return "cancelled";
    case "EXPIRED":
      return "expired";
    case "REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

/** Sale id from a postback body (shape not published: try the usual places). */
export function webhookSaleId(body: Record<string, unknown>): string | null {
  const data = (body["data"] && typeof body["data"] === "object" ? body["data"] : {}) as Record<string, unknown>;
  for (const value of [data["transactionId"], data["id"], body["transactionId"], body["id"]]) {
    if (typeof value === "string" && /^[A-Za-z0-9_-]{4,64}$/.test(value)) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

export class BlackcatGateway implements PaymentGateway {
  constructor(private readonly credentials: BlackcatCredentials) {}

  private request<T>(path: string, init: RequestInit = {}) {
    return requestJson<{ success?: boolean; data?: T; message?: string }>("Blackcat", `${API}${path}`, {
      ...init,
      headers: {
        "X-API-Key": this.credentials.api_key,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  }

  async testConnection(): Promise<ConnectionResult> {
    // No read endpoint is documented besides the sale status: an invalid key
    // answers 401/403, a valid one reaches the lookup (sale not found).
    let res;
    try {
      res = await this.request("/sales/pavox-connection-test/status");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) {
      return { status: connectionStatusFor(res.status) };
    }
    return { status: "connected" };
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method !== "pix") {
      throw new GatewayError("invalid_request", "A Blackcat processa só Pix na PAVOX.");
    }
    const doc = onlyDigits(input.buyer.document);
    const phone = onlyDigits(input.buyer.phone);
    if (doc.length !== 11 && doc.length !== 14) {
      throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    }
    if (phone.length < 10) throw new GatewayError("invalid_request", "Telefone do comprador ausente.");
    const cents = Math.round(input.amount * 100);

    const res = await this.request<BlackcatSale>("/sales/create-sale", {
      method: "POST",
      body: JSON.stringify({
        amount: cents,
        currency: "BRL",
        paymentMethod: "pix",
        items: [{ title: input.product.name.slice(0, 100), unitPrice: cents, quantity: 1, tangible: false }],
        customer: {
          name: input.buyer.name.slice(0, 100),
          email: input.buyer.email,
          phone,
          document: { number: doc, type: doc.length === 11 ? "cpf" : "cnpj" },
        },
        pix: { expiresInDays: 1 },
        postbackUrl: input.notificationUrl,
        externalRef: input.orderId,
        metadata: { orderId: input.orderId, reference: input.reference },
      }),
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    const sale = res.data.data ?? {};
    if (!sale.transactionId) throw new GatewayError("unknown_error", "Resposta da Blackcat sem ID da venda.");
    if (sale.amount !== undefined && sale.amount !== cents) {
      throw new GatewayError("unknown_error", "A Blackcat devolveu um valor diferente do pedido.");
    }
    const code = sale.paymentData?.copyPaste || sale.paymentData?.qrCode || "";
    if (!code) throw new GatewayError("unknown_error", "Resposta da Blackcat sem QR Code Pix.");
    const image = sale.paymentData?.qrCodeBase64 ?? "";
    return {
      paymentId: sale.transactionId,
      status: normalize(sale.status),
      statusDetail: sale.status ?? "",
      ticketUrl: null,
      expiresAt: sale.paymentData?.expiresAt ?? input.expiresAt.toISOString(),
      qrCode: code,
      qrCodeBase64: image.startsWith("http") ? "" : image.replace(/^data:image\/[a-z]+;base64,/, ""),
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const res = await this.request<BlackcatSale>(`/sales/${encodeURIComponent(paymentId)}/status`);
    if (!res.ok || res.data.success === false) throw failure(res.status, errorMessage(res.data, res.status));
    const sale = res.data.data ?? {};
    return {
      id: sale.transactionId ?? paymentId,
      status: normalize(sale.status),
      rawStatus: sale.status ?? "",
      // Centavos. Without it the order is never approved (amount check fails).
      amount: typeof sale.amount === "number" ? sale.amount / 100 : NaN,
      currency: "BRL",
      externalReference: sale.externalRef ?? null,
    };
  }

  refund(_paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    return Promise.reject(
      new GatewayError("payment_rejected", "o reembolso é feito no painel da Blackcat (a API não oferece estorno)."),
    );
  }
}

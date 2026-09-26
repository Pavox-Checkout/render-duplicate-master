// HopySplit adapter — white-label gateway platform (Hopy Pay).
//
// Several brands run on it with their own API host: Beehive, Axion Pay, Pagou
// (legacy API), CredWave… The API is the same for all of them (checked against
// the official Beehive SDKs, which also point their sandbox at HopySplit):
//   POST /v1/transactions, GET /v1/transactions/{id},
//   POST /v1/transactions/{id}/refund, GET /v1/company
//   Authorization: Basic base64("<secret_key>:x"); amounts in centavos.
// Card is not offered here: it would require raw card data on PAVOX servers.
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

export const HOPYSPLIT_SANDBOX_URL = "https://api.sandbox.hopysplit.com.br/v1";

export type HopySplitBrand = {
  /** Name shown in errors ("Beehive não respondeu."). */
  name: string;
  productionUrl: string;
  sandboxUrl: string;
};

export type HopySplitCredentials = { secret_key: string };

type HsTransaction = {
  id?: number | string;
  amount?: number;
  status?: string;
  paymentMethod?: string;
  secureUrl?: string;
  externalRef?: string | null;
  metadata?: Record<string, unknown> | null;
  pix?: { qrcode?: string; expirationDate?: string } | null;
  boleto?: { url?: string; barcode?: string; digitableLine?: string; expirationDate?: string } | null;
};

export function normalize(status: string | undefined): NormalizedPaymentStatus {
  switch (status) {
    case "paid":
      return "approved";
    case "refused":
      return "rejected";
    case "refunded":
    case "chargedback":
      return "refunded";
    default:
      // waiting_payment, processing, analyzing, pending_review, authorized,
      // pending_refund (money not returned yet)…
      return "pending";
  }
}

/** Transaction id from a postback body (shape not published: try the usual places). */
export function postbackTransactionId(body: Record<string, unknown>): string | null {
  const data = (body["data"] && typeof body["data"] === "object" ? body["data"] : {}) as Record<string, unknown>;
  for (const value of [data["id"], body["objectId"], body["id"]]) {
    if ((typeof value === "number" && Number.isFinite(value)) || (typeof value === "string" && /^\d{1,20}$/.test(value))) {
      return String(value);
    }
  }
  return null;
}

export class HopySplitGateway implements PaymentGateway {
  private readonly baseUrl: string;

  constructor(
    private readonly brand: HopySplitBrand,
    private readonly credentials: HopySplitCredentials,
    environment: "sandbox" | "production",
  ) {
    this.baseUrl = environment === "production" ? brand.productionUrl : brand.sandboxUrl;
  }

  private request<T>(path: string, init: RequestInit = {}) {
    return requestJson<T>(this.brand.name, `${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Basic ${btoa(`${this.credentials.secret_key}:x`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  }

  async testConnection(): Promise<ConnectionResult> {
    let res;
    try {
      res = await this.request<{ name?: string; legalName?: string; email?: string }>("/company");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (!res.ok) return { status: connectionStatusFor(res.status) };
    return { status: "connected", accountLabel: res.data.name || res.data.legalName || res.data.email || "" };
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method === "card") {
      throw new GatewayError("invalid_request", `Cartão ainda não é processado pela ${this.brand.name} na PAVOX.`);
    }
    const doc = onlyDigits(input.buyer.document);
    const phone = onlyDigits(input.buyer.phone);
    if (doc.length !== 11 && doc.length !== 14) {
      throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    }
    if (phone.length < 10) throw new GatewayError("invalid_request", "Telefone do comprador ausente.");
    const cents = Math.round(input.amount * 100);

    const res = await this.request<HsTransaction>("/transactions", {
      method: "POST",
      body: JSON.stringify({
        amount: cents,
        paymentMethod: method,
        customer: {
          name: input.buyer.name.slice(0, 100),
          email: input.buyer.email,
          document: { type: doc.length === 11 ? "cpf" : "cnpj", number: doc },
          phone,
        },
        items: [
          {
            externalRef: input.product.id,
            title: input.product.name.slice(0, 100),
            unitPrice: cents,
            quantity: 1,
            tangible: false,
          },
        ],
        postbackUrl: input.notificationUrl,
        metadata: { orderId: input.orderId, reference: input.reference },
      }),
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));

    const tx = res.data;
    if (tx.id === undefined || tx.id === null) {
      throw new GatewayError("unknown_error", `Resposta da ${this.brand.name} sem ID da transação.`);
    }
    if (method === "pix" && !tx.pix?.qrcode) {
      throw new GatewayError("unknown_error", `Resposta da ${this.brand.name} sem QR Code Pix.`);
    }
    if (method === "boleto" && !tx.boleto?.url && !tx.boleto?.barcode) {
      throw new GatewayError("unknown_error", `Resposta da ${this.brand.name} sem boleto.`);
    }
    const status = normalize(tx.status);
    if (method === "boleto") {
      return {
        paymentId: String(tx.id),
        status,
        statusDetail: tx.status ?? "",
        ticketUrl: tx.boleto?.url ?? tx.secureUrl ?? null,
        expiresAt: tx.boleto?.expirationDate ?? null,
        digitableLine: tx.boleto?.digitableLine ?? tx.boleto?.barcode ?? "",
        barcode: tx.boleto?.barcode ?? "",
      };
    }
    return {
      paymentId: String(tx.id),
      status,
      statusDetail: tx.status ?? "",
      ticketUrl: tx.secureUrl ?? null,
      expiresAt: tx.pix?.expirationDate ?? input.expiresAt.toISOString(),
      // HopySplit returns only the copia e cola; the checkout draws the QR from it.
      qrCode: tx.pix?.qrcode ?? "",
      qrCodeBase64: "",
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const res = await this.request<HsTransaction>(`/transactions/${encodeURIComponent(paymentId)}`);
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    const tx = res.data;
    const orderId = tx.metadata?.["orderId"];
    return {
      id: String(tx.id ?? paymentId),
      status: normalize(tx.status),
      rawStatus: tx.status ?? "",
      amount: typeof tx.amount === "number" ? tx.amount / 100 : NaN,
      currency: "BRL",
      externalReference: typeof orderId === "string" ? orderId : null,
    };
  }

  async refund(paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    const res = await this.request<HsTransaction>(`/transactions/${encodeURIComponent(paymentId)}/refund`, {
      method: "POST",
      body: "{}",
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    return { status: normalize(res.data.status) };
  }
}

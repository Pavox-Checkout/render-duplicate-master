// Pagou adapter — API v2 (Pix and boleto). Not the legacy HopySplit host.
//
// Reference: Pagou's official examples repository (github.com/PagouAi/examples),
// transcribed from their OpenAPI schema:
//   POST /v2/transactions, GET /v2/transactions/{id},
//   PUT /v2/transactions/{id}/refund (Idempotency-Key)
//   Authorization: Bearer <token>; amounts in centavos; envelope { success, data }.
// `external_ref` is unique per account: a retry answers 409 instead of charging twice.
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

const API = {
  production: "https://api.pagou.ai",
  sandbox: "https://api.sandbox.pagou.ai",
};

export type PagouV2Credentials = { api_token: string };

type PagouTransaction = {
  id?: string;
  status?: string;
  method?: string;
  amount?: number;
  currency?: string;
  external_ref?: string | null;
  pix?: { qr_code?: string; expiration_date?: string; receipt_url?: string | null } | null;
  voucher?: {
    barcode?: string | null;
    digitable_line?: string | null;
    url?: string | null;
    expiration_date?: string | null;
  } | null;
};

type Envelope<T> = { success?: boolean; data?: T; error?: unknown; message?: string };

export function normalize(status: string | undefined): NormalizedPaymentStatus {
  switch (status) {
    case "paid":
    case "captured":
    // Only part of the money went back: the sale stands.
    case "partially_refunded":
      return "approved";
    case "refused":
      return "rejected";
    case "canceled":
      return "cancelled";
    case "expired":
      return "expired";
    case "refunded":
    case "chargedback":
      return "refunded";
    default:
      // pending, processing, authorized, three_ds_required, partially_paid, med, in_protest…
      return "pending";
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Transaction id from a webhook (`{ event: "transaction", data: { id } }`). */
export function webhookTransactionId(body: Record<string, unknown>): string | null {
  const data = (body["data"] && typeof body["data"] === "object" ? body["data"] : {}) as Record<string, unknown>;
  const id = data["id"];
  return typeof id === "string" && UUID_RE.test(id) ? id : null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class PagouV2Gateway implements PaymentGateway {
  private readonly baseUrl: string;

  constructor(
    private readonly credentials: PagouV2Credentials,
    environment: "sandbox" | "production",
    private readonly voucherPollMs = 1_500,
  ) {
    this.baseUrl = API[environment];
  }

  private request<T>(path: string, init: RequestInit = {}) {
    return requestJson<Envelope<T>>("Pagou", `${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.credentials.api_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  }

  private async fetchTransaction(id: string): Promise<PagouTransaction> {
    const res = await this.request<PagouTransaction>(`/v2/transactions/${encodeURIComponent(id)}`);
    if (!res.ok || !res.data.data) throw failure(res.status, errorMessage(res.data, res.status));
    return res.data.data;
  }

  async testConnection(): Promise<ConnectionResult> {
    let res;
    try {
      res = await this.request("/v2/transactions?limit=1");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (!res.ok) return { status: connectionStatusFor(res.status) };
    return { status: "connected" };
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method === "card") {
      throw new GatewayError("invalid_request", "Cartão ainda não é processado pela Pagou na PAVOX.");
    }
    const doc = onlyDigits(input.buyer.document);
    if (doc.length !== 11 && doc.length !== 14) {
      throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    }
    const phone = onlyDigits(input.buyer.phone);
    const cents = Math.round(input.amount * 100);

    const res = await this.request<PagouTransaction>("/v2/transactions", {
      method: "POST",
      body: JSON.stringify({
        amount: cents,
        method: method === "boleto" ? "voucher" : "pix",
        currency: "BRL",
        buyer: {
          name: input.buyer.name.slice(0, 200),
          email: input.buyer.email,
          ...(phone.length >= 10 ? { phone } : {}),
          document: { type: doc.length === 11 ? "CPF" : "CNPJ", number: doc },
        },
        products: [{ name: input.product.name.slice(0, 200), price: cents, quantity: 1 }],
        external_ref: input.orderId,
        notify_url: input.notificationUrl,
      }),
    });
    if (!res.ok || !res.data.data) throw failure(res.status, errorMessage(res.data, res.status));
    let tx = res.data.data;
    if (!tx.id) throw new GatewayError("unknown_error", "Resposta da Pagou sem ID da transação.");

    if (method === "boleto") {
      // The boleto can be issued a moment after the transaction is created.
      for (let i = 0; i < 3 && !tx.voucher?.digitable_line && !tx.voucher?.url; i++) {
        await sleep(this.voucherPollMs);
        tx = await this.fetchTransaction(tx.id!);
      }
      if (!tx.voucher?.digitable_line && !tx.voucher?.url) {
        throw new GatewayError("unknown_error", "A Pagou ainda não emitiu o boleto.");
      }
      return {
        paymentId: tx.id!,
        status: normalize(tx.status),
        statusDetail: tx.status ?? "",
        ticketUrl: tx.voucher?.url ?? null,
        expiresAt: tx.voucher?.expiration_date ?? null,
        digitableLine: tx.voucher?.digitable_line ?? tx.voucher?.barcode ?? "",
        barcode: tx.voucher?.barcode ?? "",
      };
    }
    if (!tx.pix?.qr_code) throw new GatewayError("unknown_error", "Resposta da Pagou sem QR Code Pix.");
    return {
      paymentId: tx.id,
      status: normalize(tx.status),
      statusDetail: tx.status ?? "",
      ticketUrl: null,
      expiresAt: tx.pix.expiration_date ?? input.expiresAt.toISOString(),
      qrCode: tx.pix.qr_code,
      qrCodeBase64: "",
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const tx = await this.fetchTransaction(paymentId);
    return {
      id: tx.id ?? paymentId,
      status: normalize(tx.status),
      rawStatus: tx.status ?? "",
      amount: typeof tx.amount === "number" ? tx.amount / 100 : NaN,
      currency: (tx.currency ?? "BRL").toUpperCase(),
      externalReference: tx.external_ref ?? null,
    };
  }

  async refund(paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    const res = await this.request<{ is_full_refund?: boolean }>(
      `/v2/transactions/${encodeURIComponent(paymentId)}/refund`,
      {
        method: "PUT",
        headers: { "Idempotency-Key": `pavox-refund-${paymentId}` },
        body: JSON.stringify({ reason: "requested_by_customer" }),
      },
    );
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    return { status: res.data.data?.is_full_refund ? "refunded" : "pending" };
  }
}

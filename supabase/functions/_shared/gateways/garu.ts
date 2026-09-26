// Garu adapter — REST API v1 (Pix and boleto).
//
// Reference: the official @garuhq/node SDK and garu-cli (MIT). Auth is
// `Authorization: Bearer sk_test_…|sk_live_…`; mutations take X-Idempotency-Key.
// Garu charges a *product*, so PAVOX keeps one mirror product per
// (PAVOX product, price) in the merchant's Garu account (ProductRefStore).
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

const API = "https://garu.com.br/api/v1";

export type GaruCredentials = { api_key: string };

/** Where the mirror product ids live (a table in PAVOX, per merchant). */
export interface ProductRefStore {
  get(key: string): Promise<string | null>;
  put(key: string, externalId: string): Promise<void>;
}

type GaruCharge = {
  uuid?: string;
  status?: string;
  chargedTotal?: number;
  amount?: number;
  pix?: { code?: string } | null;
  boleto?: { barcodeLine?: string; pdfUrl?: string } | null;
  expiresAt?: string | null;
};

export function normalize(status: string | undefined): NormalizedPaymentStatus {
  switch (status) {
    case "paid":
      return "approved";
    case "failed":
      return "rejected";
    case "expired":
      return "expired";
    case "canceled":
      return "cancelled";
    case "refunded":
    case "chargeback":
      return "refunded";
    default:
      return "pending"; // pending, authorized, refund_pending
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Charge uuid from a webhook payload (searched in the usual nesting levels). */
export function webhookChargeId(body: Record<string, unknown>): string | null {
  const levels: unknown[] = [body];
  for (const key of ["data", "payload", "charge", "transaction"]) {
    const nested = body[key];
    if (nested && typeof nested === "object") {
      levels.push(nested);
      for (const inner of ["charge", "transaction"]) {
        const deeper = (nested as Record<string, unknown>)[inner];
        if (deeper && typeof deeper === "object") levels.push(deeper);
      }
    }
  }
  for (const level of levels.reverse()) {
    const l = level as Record<string, unknown>;
    for (const key of ["chargeUuid", "charge_uuid", "transactionUuid", "uuid"]) {
      const value = l[key];
      if (typeof value === "string" && UUID_RE.test(value)) return value;
    }
  }
  return null;
}

export class GaruGateway implements PaymentGateway {
  constructor(
    private readonly credentials: GaruCredentials,
    private readonly environment: "sandbox" | "production",
    private readonly products?: ProductRefStore,
  ) {}

  private request<T>(path: string, init: RequestInit = {}) {
    return requestJson<T>("Garu", `${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.credentials.api_key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  }

  async testConnection(): Promise<ConnectionResult> {
    const key = this.credentials.api_key ?? "";
    if (this.environment === "production" && key.startsWith("sk_test_")) return { status: "environment_mismatch" };
    let res;
    try {
      res = await this.request("/charges?limit=1");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (!res.ok) return { status: connectionStatusFor(res.status) };
    return { status: "connected", accountLabel: key.startsWith("sk_test_") ? "Modo de teste" : "" };
  }

  private async mirrorProduct(input: ChargeInput): Promise<string> {
    const price = Number(input.amount.toFixed(2));
    const key = `${input.product.id}:${price.toFixed(2)}`;
    const known = await this.products?.get(key);
    if (known) return known;
    const res = await this.request<{ uuid?: string }>("/products", {
      method: "POST",
      headers: { "X-Idempotency-Key": `pavox-product-${key}` },
      body: JSON.stringify({
        name: input.product.name.slice(0, 100),
        value: price,
        pix: true,
        boleto: true,
        creditCard: false,
        statementDescriptor: input.statementDescriptor.slice(0, 22),
      }),
    });
    if (!res.ok || !res.data.uuid) throw failure(res.status, errorMessage(res.data, res.status));
    await this.products?.put(key, res.data.uuid);
    return res.data.uuid;
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method === "card") {
      throw new GatewayError("invalid_request", "Cartão ainda não é processado pela Garu na PAVOX.");
    }
    const doc = onlyDigits(input.buyer.document);
    const phone = onlyDigits(input.buyer.phone);
    if (doc.length !== 11 && doc.length !== 14) throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    if (phone.length < 10) throw new GatewayError("invalid_request", "Telefone do comprador ausente.");
    const address = (input.buyer.address ?? {}) as Partial<Address>;
    const productId = await this.mirrorProduct(input);

    const res = await this.request<GaruCharge>("/charges", {
      method: "POST",
      // One charge per PAVOX order and method, even if the request is retried.
      headers: { "X-Idempotency-Key": `pavox-${input.orderId}-${method}` },
      body: JSON.stringify({
        productId,
        paymentMethod: method,
        customer: {
          name: input.buyer.name.slice(0, 255),
          email: input.buyer.email,
          document: doc,
          phone: phone.slice(-11),
          ...(address.zip
            ? {
                zipCode: onlyDigits(address.zip),
                street: address.street ?? "",
                number: address.number || "S/N",
                complement: address.complement ?? "",
                neighborhood: address.neighborhood ?? "",
                city: address.city ?? "",
                state: (address.state ?? "").toUpperCase(),
              }
            : {}),
        },
        additionalInfo: `PAVOX ${input.reference} ${input.orderId}`,
      }),
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    const charge = res.data;
    if (!charge.uuid) throw new GatewayError("unknown_error", "Resposta da Garu sem ID da cobrança.");

    if (method === "boleto") {
      if (!charge.boleto?.barcodeLine && !charge.boleto?.pdfUrl) {
        throw new GatewayError("unknown_error", "Resposta da Garu sem boleto.");
      }
      return {
        paymentId: charge.uuid,
        status: normalize(charge.status),
        statusDetail: charge.status ?? "",
        ticketUrl: charge.boleto?.pdfUrl ?? null,
        expiresAt: charge.expiresAt ?? null,
        digitableLine: charge.boleto?.barcodeLine ?? "",
        barcode: "",
      };
    }
    if (!charge.pix?.code) throw new GatewayError("unknown_error", "Resposta da Garu sem QR Code Pix.");
    return {
      paymentId: charge.uuid,
      status: normalize(charge.status),
      statusDetail: charge.status ?? "",
      ticketUrl: null,
      expiresAt: input.expiresAt.toISOString(),
      qrCode: charge.pix.code,
      qrCodeBase64: "",
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const res = await this.request<GaruCharge>(`/charges/${encodeURIComponent(paymentId)}`);
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    const charge = res.data;
    return {
      id: charge.uuid ?? paymentId,
      status: normalize(charge.status),
      rawStatus: charge.status ?? "",
      amount: Number(charge.chargedTotal ?? charge.amount ?? NaN),
      currency: "BRL",
      externalReference: null,
    };
  }

  async refund(paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    const res = await this.request<GaruCharge>(`/charges/${encodeURIComponent(paymentId)}/refund`, {
      method: "POST",
      headers: { "X-Idempotency-Key": `pavox-refund-${paymentId}` },
      body: "{}",
    });
    if (!res.ok) throw failure(res.status, errorMessage(res.data, res.status));
    return { status: normalize(res.data.status) };
  }
}

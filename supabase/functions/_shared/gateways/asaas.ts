// Asaas adapter — API v3 (Pix and boleto).
//
// Auth: the merchant's API key in the `access_token` header. Every charge
// belongs to an Asaas customer, which requires the buyer's CPF/CNPJ.
// Asaas has no idempotency header, so a charge is first looked up by
// externalReference (= PAVOX order id) before a new one is created.
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

const API = {
  production: "https://api.asaas.com/v3",
  sandbox: "https://api-sandbox.asaas.com/v3",
};
const TIMEOUT_MS = 15_000;

export type AsaasCredentials = { api_key: string; webhook_token?: string; wallet_id?: string };

/** PAVOX's own Asaas wallet (receives the platform fee by split). Optional. */
export function platformWalletId(): string {
  return Deno.env.get("ASAAS_PLATFORM_WALLET_ID") ?? "";
}

/**
 * Fee sent as split, or null when it does not apply: no PAVOX wallet
 * configured, the merchant is PAVOX itself, or a fee that rounds to zero.
 */
export function asaasSplitFee(credentials: Record<string, string>, fee: number): number | null {
  const wallet = platformWalletId();
  if (!wallet || credentials["wallet_id"] === wallet) return null;
  if (!Number.isFinite(fee) || fee <= 0) return null;
  return Math.round(fee * 100) / 100;
}

type AsaasError = { errors?: Array<{ code?: string; description?: string }> };

type AsaasPayment = {
  id?: string;
  status?: string;
  value?: number;
  billingType?: string;
  externalReference?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  dueDate?: string;
  deleted?: boolean;
};

/** Events the PAVOX webhook listens to (registered on connect). */
export const ASAAS_WEBHOOK_EVENTS = [
  "PAYMENT_CREATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
];

export function connectionStatusFor(httpStatus: number): ConnectionResult["status"] {
  if (httpStatus === 401) return "invalid_credentials";
  if (httpStatus === 403) return "permission_error";
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus >= 500) return "gateway_unavailable";
  return "unknown_error";
}

// Asaas statuses → internal. RECEIVED (Pix/boleto paid) and CONFIRMED are paid.
export function normalize(status: string | undefined, deleted = false): NormalizedPaymentStatus {
  if (deleted) return "cancelled";
  switch (status) {
    case "RECEIVED":
    case "CONFIRMED":
    case "RECEIVED_IN_CASH":
      return "approved";
    case "OVERDUE":
      return "expired";
    case "REFUNDED":
      return "refunded";
    default:
      // PENDING, AWAITING_RISK_ANALYSIS, REFUND_REQUESTED, REFUND_IN_PROGRESS,
      // CHARGEBACK_* (money in dispute, not returned yet)…
      return "pending";
  }
}

/** Date (YYYY-MM-DD) in Brazil, `days` from now. */
export function brDate(days: number, now = Date.now()): string {
  const d = new Date(now + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

function errorDetail(data: AsaasError, status: number): string {
  const e = data.errors?.[0];
  return [e?.code, e?.description].filter(Boolean).join(" | ") || `HTTP ${status}`;
}

export class AsaasGateway implements PaymentGateway {
  constructor(
    private readonly credentials: AsaasCredentials,
    private readonly environment: "sandbox" | "production",
  ) {}

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(`${API[this.environment]}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          access_token: this.credentials.api_key,
          "Content-Type": "application/json",
          "User-Agent": "PAVOX",
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw new GatewayError("gateway_unavailable", "Asaas não respondeu.");
    } finally {
      clearTimeout(timer);
    }
  }

  /** JSON call that turns Asaas errors into GatewayError. */
  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await this.request(path, init);
    const data = (await res.json().catch(() => ({}))) as T & AsaasError;
    if (!res.ok) {
      const detail = errorDetail(data, res.status);
      if (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) {
        throw new GatewayError(connectionStatusFor(res.status), detail, res.status);
      }
      throw new GatewayError("payment_rejected", detail, res.status);
    }
    return data;
  }

  async testConnection(): Promise<ConnectionResult> {
    const key = this.credentials.api_key ?? "";
    if (this.environment === "production" && key.includes("_hmlg_")) return { status: "environment_mismatch" };
    let res: Response;
    try {
      res = await this.request("/myAccount/commercialInfo");
      // Older accounts may not expose commercialInfo: any authenticated read proves the key.
      if (res.status === 404) res = await this.request("/finance/balance");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (!res.ok) return { status: connectionStatusFor(res.status) };
    const info = (await res.json().catch(() => ({}))) as { companyName?: string; name?: string; email?: string };
    return { status: "connected", accountLabel: info.companyName || info.name || info.email || "" };
  }

  /** The merchant's own wallet id (to never split a charge to itself). */
  async walletId(): Promise<string> {
    try {
      const res = await this.request("/wallets");
      if (!res.ok) return "";
      const data = (await res.json()) as { data?: Array<{ id?: string }> };
      return data.data?.[0]?.id ?? "";
    } catch {
      return "";
    }
  }

  /** Whether the account has an active Pix key (required to receive Pix). */
  async hasPixKey(): Promise<boolean | null> {
    try {
      const res = await this.request("/pix/addressKeys?status=ACTIVE&limit=1");
      if (!res.ok) return null;
      const data = (await res.json()) as { totalCount?: number; data?: unknown[] };
      return (data.totalCount ?? data.data?.length ?? 0) > 0;
    } catch {
      return null;
    }
  }

  /**
   * Creates or updates the PAVOX webhook on the merchant's account. Asaas sends
   * `authToken` back in the `asaas-access-token` header of every delivery.
   */
  async ensureWebhook(url: string, email: string, authToken: string): Promise<void> {
    const body = JSON.stringify({
      name: "PAVOX",
      url,
      email,
      enabled: true,
      interrupted: false,
      apiVersion: 3,
      authToken,
      sendType: "SEQUENTIALLY",
      events: ASAAS_WEBHOOK_EVENTS,
    });
    const list = await this.call<{ data?: Array<{ id?: string; url?: string }> }>("/webhooks?limit=100");
    const existing = list.data?.find((w) => w.url === url);
    if (existing?.id) {
      await this.call(`/webhooks/${encodeURIComponent(existing.id)}`, { method: "PUT", body });
    } else {
      await this.call("/webhooks", { method: "POST", body });
    }
  }

  private async customerFor(input: ChargeInput): Promise<string> {
    const doc = input.buyer.document.replace(/\D/g, "");
    if (doc.length !== 11 && doc.length !== 14) {
      throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    }
    const found = await this.call<{ data?: Array<{ id?: string; deleted?: boolean }> }>(
      `/customers?cpfCnpj=${doc}&limit=10`,
    );
    const current = found.data?.find((c) => c.id && !c.deleted);
    if (current?.id) return current.id;

    const address = (input.buyer.address ?? {}) as Partial<Address>;
    const phone = input.buyer.phone.replace(/\D/g, "");
    const created = await this.call<{ id?: string }>("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: input.buyer.name.slice(0, 100),
        cpfCnpj: doc,
        email: input.buyer.email,
        ...(phone.length >= 10 ? { mobilePhone: phone } : {}),
        ...(address.zip
          ? {
              postalCode: address.zip.replace(/\D/g, ""),
              address: address.street ?? "",
              addressNumber: address.number || "S/N",
              complement: address.complement ?? "",
              province: address.neighborhood ?? "",
            }
          : {}),
        // PAVOX sends its own e-mails; the buyer must not get Asaas' notices too.
        notificationDisabled: true,
      }),
    });
    if (!created.id) throw new GatewayError("unknown_error", "Asaas não devolveu o cliente.");
    return created.id;
  }

  private async existingCharge(orderId: string): Promise<AsaasPayment | null> {
    const found = await this.call<{ data?: AsaasPayment[] }>(
      `/payments?externalReference=${encodeURIComponent(orderId)}&limit=10`,
    );
    return found.data?.find((p) => p.id && !p.deleted) ?? null;
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method === "card") {
      throw new GatewayError("invalid_request", "Cartão ainda não é processado pelo Asaas na PAVOX.");
    }

    let payment = await this.existingCharge(input.orderId);
    if (!payment) {
      const customer = await this.customerFor(input);
      payment = await this.call<AsaasPayment>("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer,
          billingType: method === "boleto" ? "BOLETO" : "PIX",
          value: Number(input.amount.toFixed(2)),
          // Pix: due today (the QR code stays payable; the order expires on our side).
          dueDate: brDate(method === "boleto" ? 3 : 0),
          description: input.description.slice(0, 500),
          externalReference: input.orderId,
          ...(input.marketplaceFee
            ? { split: [{ walletId: platformWalletId(), fixedValue: input.marketplaceFee }] }
            : {}),
        }),
      });
    }
    if (!payment.id) throw new GatewayError("unknown_error", "Resposta do Asaas sem ID da cobrança.");
    const id = encodeURIComponent(payment.id);

    if (method === "boleto") {
      const line = await this.call<{ identificationField?: string; barCode?: string }>(
        `/payments/${id}/identificationField`,
      );
      if (!payment.bankSlipUrl && !line.identificationField) {
        throw new GatewayError("unknown_error", "Resposta do Asaas sem boleto.");
      }
      return {
        paymentId: payment.id,
        status: normalize(payment.status, payment.deleted),
        statusDetail: payment.status ?? "",
        ticketUrl: payment.bankSlipUrl ?? payment.invoiceUrl ?? null,
        // Asaas gives a plain date; the boleto is payable until the end of that day in Brazil.
        expiresAt: payment.dueDate ? `${payment.dueDate}T23:59:59-03:00` : null,
        digitableLine: line.identificationField ?? "",
        barcode: line.barCode ?? "",
      };
    }

    const qr = await this.call<{ payload?: string; encodedImage?: string; expirationDate?: string }>(
      `/payments/${id}/pixQrCode`,
    );
    if (!qr.payload) throw new GatewayError("unknown_error", "Resposta do Asaas sem QR Code Pix.");
    return {
      paymentId: payment.id,
      status: normalize(payment.status, payment.deleted),
      statusDetail: payment.status ?? "",
      ticketUrl: payment.invoiceUrl ?? null,
      expiresAt: input.expiresAt.toISOString(),
      qrCode: qr.payload,
      qrCodeBase64: qr.encodedImage ?? "",
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const res = await this.request(`/payments/${encodeURIComponent(paymentId)}`);
    if (!res.ok) throw new GatewayError(connectionStatusFor(res.status), `HTTP ${res.status}`, res.status);
    const data = (await res.json()) as AsaasPayment;
    return {
      id: data.id ?? paymentId,
      status: normalize(data.status, data.deleted),
      rawStatus: `${data.status ?? ""}${data.deleted ? "/deleted" : ""}`,
      amount: Number(data.value ?? NaN),
      currency: "BRL",
      externalReference: data.externalReference ?? null,
    };
  }

  async refund(paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    // Empty body = full refund.
    const data = await this.call<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: "POST",
      body: "{}",
    });
    return { status: normalize(data.status, data.deleted) };
  }
}

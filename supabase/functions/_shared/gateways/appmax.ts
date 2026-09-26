// Appmax adapter — API v3 (Pix and boleto).
//
// Reference: E-Com Plus' open-source Appmax app (@cloudcommerce/app-appmax,
// in production) and the @appmax-api/sdk package. Flow:
//   POST /customer → POST /order → POST /payment/pix | /payment/boleto
//   GET /order/{id} (status, total), POST /refund {order_id, refund_type}
// The merchant's `access-token` goes in the JSON body (query string on GET).
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
import { connectionStatusFor, errorMessage, failure, onlyDigits, requestJson, splitName } from "./http-json.ts";

const API = {
  production: "https://admin.appmax.com.br/api/v3",
  sandbox: "https://homolog.sandboxappmax.com.br/api/v3",
};

export type AppmaxCredentials = { access_token: string };

type AppmaxEnvelope<T> = { success?: boolean; status?: number; text?: string; data?: T } & Record<string, unknown>;

type AppmaxPayment = {
  pay_reference?: string;
  pix_emv?: string;
  pix_qrcode?: string;
  pix_expiration_date?: string;
  pdf?: string;
  due_date?: string;
  digitable_line?: string;
  boleto_payment_code?: string;
  status?: string;
};

type AppmaxOrder = { id?: number | string; status?: string; total?: number | string | null; full_payment_amount?: string };

export function normalize(status: string | undefined): NormalizedPaymentStatus {
  switch (status) {
    case "aprovado":
    case "integrado":
      return "approved";
    case "estornado":
      return "refunded";
    case "cancelado":
      return "cancelled";
    default:
      // pendente, autorizado, analisando, pending_refund…
      return "pending";
  }
}

/** Appmax order id from a webhook body (`{ event, data: { id } }`). */
export function webhookOrderId(body: Record<string, unknown>): string | null {
  const data = (body["data"] && typeof body["data"] === "object" ? body["data"] : {}) as Record<string, unknown>;
  const id = data["id"] ?? data["order_id"] ?? body["order_id"];
  if ((typeof id === "number" && Number.isFinite(id)) || (typeof id === "string" && /^\d{1,20}$/.test(id))) {
    return String(id);
  }
  return null;
}

function ok<T>(res: { ok: boolean; data: AppmaxEnvelope<T> }): boolean {
  return res.ok && res.data.success !== false && (res.data.status === undefined || res.data.status === 200);
}

export class AppmaxGateway implements PaymentGateway {
  private readonly baseUrl: string;

  constructor(
    private readonly credentials: AppmaxCredentials,
    environment: "sandbox" | "production",
  ) {
    this.baseUrl = API[environment];
  }

  private post<T>(path: string, body: Record<string, unknown>) {
    return requestJson<AppmaxEnvelope<T>>("Appmax", `${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...body, "access-token": this.credentials.access_token }),
    });
  }

  private get<T>(path: string) {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("access-token", this.credentials.access_token);
    return requestJson<AppmaxEnvelope<T>>("Appmax", url.toString(), { headers: { Accept: "application/json" } });
  }

  async testConnection(): Promise<ConnectionResult> {
    // Any authenticated read: an invalid token answers 401, a valid one reaches
    // the order lookup (not found / other store).
    let res;
    try {
      res = await this.get<AppmaxOrder>("/order/0");
    } catch {
      return { status: "gateway_unavailable" };
    }
    if (res.status === 401 || res.status === 429 || res.status >= 500) {
      return { status: connectionStatusFor(res.status) };
    }
    return { status: "connected" };
  }

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const method = input.method ?? "pix";
    if (method === "card") {
      throw new GatewayError("invalid_request", "Cartão ainda não é processado pela Appmax na PAVOX.");
    }
    const doc = onlyDigits(input.buyer.document);
    if (doc.length !== 11 && doc.length !== 14) {
      throw new GatewayError("invalid_request", "CPF/CNPJ do comprador ausente.");
    }
    const phone = onlyDigits(input.buyer.phone);
    const address = (input.buyer.address ?? {}) as Partial<Address>;
    const { first, last } = splitName(input.buyer.name);

    const customer = await this.post<{ id?: number; customer_id?: number }>("/customer", {
      firstname: first,
      lastname: last,
      email: input.buyer.email,
      telephone: phone,
      ...(address.zip
        ? {
            postcode: onlyDigits(address.zip).padStart(8, "0"),
            address_street: address.street ?? "",
            address_street_number: address.number || "SN",
            address_street_complement: address.complement ?? "",
            address_street_district: address.neighborhood ?? "",
            address_city: address.city ?? "",
            address_state: address.state ?? "",
          }
        : {}),
      products: [{ product_sku: input.product.id, product_qty: 1 }],
    });
    const customerId = customer.data.data?.id ?? customer.data.data?.customer_id ?? customer.data["customer_id"];
    if (!ok(customer) || !customerId) throw failure(customer.status, errorMessage(customer.data, customer.status));

    const order = await this.post<{ id?: number; order_id?: number }>("/order", {
      total: Number(input.amount.toFixed(2)),
      products: [
        { sku: input.product.id, name: input.product.name.slice(0, 100), qty: 1, price: Number(input.amount.toFixed(2)) },
      ],
      shipping: 0,
      discount: 0,
      customer_id: customerId,
    });
    const orderId = order.data.data?.id ?? order.data.data?.order_id ?? order.data["order_id"];
    if (!ok(order) || !orderId) throw failure(order.status, errorMessage(order.data, order.status));

    const common = { cart: { order_id: orderId }, customer: { customer_id: customerId } };
    const payment =
      method === "boleto"
        ? await this.post<AppmaxPayment>("/payment/boleto", { ...common, payment: { Boleto: { document_number: doc } } })
        : await this.post<AppmaxPayment>("/payment/pix", {
            ...common,
            payment: {
              pix: {
                document_number: doc,
                // "YYYY-MM-DD HH:mm:ss", sent as UTC like the reference app does
                // (read as Brazil time it only lasts longer — never expires early).
                expiration_date: input.expiresAt.toISOString().slice(0, 19).replace("T", " "),
              },
            },
          });
    const data = payment.data.data ?? {};
    if (!ok(payment)) throw failure(payment.status, errorMessage(payment.data, payment.status));

    if (method === "boleto") {
      const line = data.digitable_line ?? data.boleto_payment_code ?? "";
      if (!line && !data.pdf) throw new GatewayError("unknown_error", "Resposta da Appmax sem boleto.");
      return {
        paymentId: String(orderId),
        status: "pending",
        statusDetail: data.status ?? "",
        ticketUrl: data.pdf ?? null,
        expiresAt: data.due_date ? new Date(data.due_date).toISOString() : null,
        digitableLine: line,
        barcode: data.boleto_payment_code ?? "",
      };
    }
    if (!data.pix_emv) throw new GatewayError("unknown_error", "Resposta da Appmax sem QR Code Pix.");
    const image = data.pix_qrcode ?? "";
    return {
      paymentId: String(orderId),
      status: "pending",
      statusDetail: data.status ?? "",
      ticketUrl: null,
      expiresAt: data.pix_expiration_date ? new Date(data.pix_expiration_date).toISOString() : input.expiresAt.toISOString(),
      qrCode: data.pix_emv,
      // Appmax sends the image as base64 (sometimes with the data: prefix).
      qrCodeBase64: image.startsWith("http") ? "" : image.replace(/^data:image\/[a-z]+;base64,/, ""),
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const res = await this.get<AppmaxOrder>(`/order/${encodeURIComponent(paymentId)}`);
    if (!ok(res)) throw failure(res.status, errorMessage(res.data, res.status));
    const order = res.data.data ?? {};
    const total = Number(order.total ?? order.full_payment_amount ?? NaN);
    return {
      id: String(order.id ?? paymentId),
      status: normalize(order.status),
      rawStatus: order.status ?? "",
      amount: total,
      currency: "BRL",
      externalReference: null,
    };
  }

  async refund(paymentId: string): Promise<{ status: NormalizedPaymentStatus }> {
    const res = await this.post<AppmaxOrder>("/refund", { order_id: Number(paymentId), refund_type: "total" });
    if (!ok(res)) throw failure(res.status, errorMessage(res.data, res.status));
    return { status: "pending" };
  }
}

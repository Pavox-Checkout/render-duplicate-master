// deno test supabase/functions/_shared/gateways/more_gateways_test.ts
// Pagou v2, FastPay, Blackcat, Stripe and Pagar.me — payloads checked against
// the fixtures in the providers' own examples / SDK schemas.
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import { BlackcatGateway, normalize as bcStatus, webhookSaleId } from "./blackcat.ts";
import { FastPayGateway, normalize as fpStatus, webhookChargeId as fpWebhook } from "./fastpay.ts";
import { PagarmeGateway, normalize as pmStatus, webhookOrderId as pmWebhook } from "./pagarme.ts";
import { PagouV2Gateway, normalize as pgStatus, webhookTransactionId } from "./pagouv2.ts";
import { StripeGateway, formEncode, normalize as stStatus, webhookIntentId } from "./stripe.ts";
import { providerSpec } from "./registry.ts";
import { GatewayError } from "./types.ts";

type Captured = { url: string; init: RequestInit };

function mockFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Captured[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = ((url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = responses.shift()!;
    return Promise.resolve(new Response(JSON.stringify(next.body), { status: next.status }));
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

const input = {
  orderId: "7b0c2d3e-1111-4222-8333-944455556666",
  reference: "PVX-ABCD1234",
  amount: 19.9,
  description: "Produto — pedido PVX-ABCD1234",
  buyer: {
    name: "Maria da Silva",
    email: "maria@example.com",
    phone: "(11) 91234-5678",
    document: "123.456.789-09",
    person_type: "pf" as const,
    address: {
      zip: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
  },
  product: { id: "9a6d41be-7a78-40f8-9580-992b44aabc95", name: "Produto", unitPrice: 19.9 },
  notificationUrl: "https://x.supabase.co/functions/v1/gateway-webhook?provider=x&store=u1",
  statementDescriptor: "LOJA",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
};

const body = (c: Captured) => JSON.parse(String(c.init.body));
const header = (c: Captured, name: string) => (c.init.headers as Record<string, string>)[name];

Deno.test("registry: new providers, methods and generic webhook", () => {
  const expected: Record<string, string[]> = {
    pagouv2: ["pix", "boleto"],
    fastpay: ["pix"],
    blackcat: ["pix"],
    stripe: ["pix", "boleto"],
    pagarme: ["pix", "boleto"],
  };
  for (const [id, methods] of Object.entries(expected)) {
    const spec = providerSpec(id)!;
    assertEquals(spec.methods, methods);
    assertEquals(typeof spec.webhookPaymentId, "function");
  }
  assertEquals(typeof providerSpec("stripe")!.onConnect, "function");
});

// ------------------------------------------------------------------- Pagou v2

Deno.test("Pagou v2 pix: Bearer, centavos, external_ref and qr_code", async () => {
  const mock = mockFetch([
    {
      status: 201,
      body: {
        success: true,
        data: {
          id: "018f1f2e-7b42-7c9a-8d3e-1a2b3c4d5e6f",
          status: "pending",
          method: "pix",
          amount: 1990,
          pix: { qr_code: "000201PIX", expiration_date: "2026-03-16T14:15:00.000Z" },
        },
      },
    },
  ]);
  try {
    const r = await new PagouV2Gateway({ api_token: "tok" }, "sandbox").createCharge({ ...input, method: "pix" });
    assertEquals(r.paymentId, "018f1f2e-7b42-7c9a-8d3e-1a2b3c4d5e6f");
    assertEquals(r.qrCode, "000201PIX");
    assertEquals(r.status, "pending");
    const c = mock.calls[0]!;
    assertEquals(c.url, "https://api.sandbox.pagou.ai/v2/transactions");
    assertEquals(header(c, "Authorization"), "Bearer tok");
    const b = body(c);
    assertEquals(b.amount, 1990);
    assertEquals(b.method, "pix");
    assertEquals(b.external_ref, input.orderId);
    assertEquals(b.buyer.document, { type: "CPF", number: "12345678909" });
    assertEquals(b.products, [{ name: "Produto", price: 1990, quantity: 1 }]);
  } finally {
    mock.restore();
  }
});

Deno.test("Pagou v2 boleto: waits for the voucher to be issued", async () => {
  const id = "018f1f2e-7b44-7c9a-8d3e-1a2b3c4d5e71";
  const mock = mockFetch([
    { status: 201, body: { success: true, data: { id, status: "pending", method: "voucher", voucher: null } } },
    {
      status: 200,
      body: {
        success: true,
        data: {
          id,
          status: "pending",
          voucher: { barcode: "0019", digitable_line: "00190.50095", url: "https://pay/v", expiration_date: "2026-03-23" },
        },
      },
    },
  ]);
  try {
    const r = await new PagouV2Gateway({ api_token: "tok" }, "production", 1).createCharge({ ...input, method: "boleto" });
    assertEquals(r.digitableLine, "00190.50095");
    assertEquals(r.ticketUrl, "https://pay/v");
    assertEquals(body(mock.calls[0]!).method, "voucher");
    assertEquals(mock.calls[1]!.url, `https://api.pagou.ai/v2/transactions/${id}`);
  } finally {
    mock.restore();
  }
});

Deno.test("Pagou v2 status, getPayment, refund and webhook", async () => {
  assertEquals(pgStatus("paid"), "approved");
  assertEquals(pgStatus("refunded"), "refunded");
  assertEquals(pgStatus("expired"), "expired");
  assertEquals(pgStatus("processing"), "pending");
  assertEquals(
    webhookTransactionId({ event: "transaction", data: { id: "018f1f2e-7b42-7c9a-8d3e-1a2b3c4d5e6f" } }),
    "018f1f2e-7b42-7c9a-8d3e-1a2b3c4d5e6f",
  );
  assertEquals(webhookTransactionId({ data: { id: "x" } }), null);
  const mock = mockFetch([
    { status: 200, body: { success: true, data: { id: "t1", status: "paid", amount: 1990, currency: "BRL", external_ref: input.orderId } } },
    { status: 200, body: { success: true, data: { is_full_refund: true } } },
  ]);
  try {
    const gw = new PagouV2Gateway({ api_token: "tok" }, "production");
    const info = await gw.getPayment("t1");
    assertEquals(info.amount, 19.9);
    assertEquals(info.status, "approved");
    assertEquals(info.externalReference, input.orderId);
    assertEquals((await gw.refund("t1")).status, "refunded");
    assertEquals(mock.calls[1]!.init.method, "PUT");
    assertEquals(header(mock.calls[1]!, "Idempotency-Key"), "pavox-refund-t1");
  } finally {
    mock.restore();
  }
});

// -------------------------------------------------------------------- FastPay

Deno.test("FastPay pix: Basic 'key:', reais and copyPaste", async () => {
  const mock = mockFetch([
    { status: 201, body: { id: "2vork", status: "pending", paymentDetails: { endToEndId: "e2e", copyPaste: "000201FP" }, reason: null } },
  ]);
  try {
    const r = await new FastPayGateway({ secret_key: "sk_abc" }).createCharge({ ...input, method: "pix" });
    assertEquals(r.paymentId, "2vork");
    assertEquals(r.qrCode, "000201FP");
    const c = mock.calls[0]!;
    assertEquals(c.url, "https://api-global.fastpaybrasil.com/v1/charges");
    assertEquals(header(c, "Authorization"), `Basic ${btoa("sk_abc:")}`);
    const b = body(c);
    assertEquals(b.amount, 19.9);
    assertEquals(b.paymentMethod.type, "pix");
    assert(b.paymentMethod.expirationInSeconds >= 900);
    assertEquals(b.customer.document, { type: "cpf", id: "12345678909" });
    assertEquals(b.metadata.order_id, input.orderId);
  } finally {
    mock.restore();
  }
});

Deno.test("FastPay: boleto refused, refused charge is an error", async () => {
  await assertRejects(() => new FastPayGateway({ secret_key: "k" }).createCharge({ ...input, method: "boleto" }), GatewayError);
  const mock = mockFetch([{ status: 201, body: { id: "c1", status: "refused", paymentDetails: null, reason: "Negado" } }]);
  try {
    await assertRejects(() => new FastPayGateway({ secret_key: "k" }).createCharge(input), GatewayError, "Negado");
  } finally {
    mock.restore();
  }
});

Deno.test("FastPay getPayment falls back to the charge list", async () => {
  assertEquals(fpStatus("paid"), "approved");
  assertEquals(fpStatus("refunded"), "refunded");
  assertEquals(fpStatus("in_analysis"), "pending");
  assertEquals(fpWebhook({ id: "evt_1", event: "charge.paid", data: { id: "2RhQg9M7" } }), "2RhQg9M7");
  const mock = mockFetch([
    { status: 404, body: { statusCode: 404, message: "Not Found" } },
    { status: 200, body: { data: [{ id: "other", status: "paid", amount: 5 }, { id: "c1", status: "paid", amount: 19.9, currency: "BRL" }] } },
  ]);
  try {
    const info = await new FastPayGateway({ secret_key: "k" }).getPayment("c1");
    assertEquals(info.status, "approved");
    assertEquals(info.amount, 19.9);
    assertStringIncludes(mock.calls[1]!.url, "/v1/charges?page=1&size=100");
  } finally {
    mock.restore();
  }
});

// ------------------------------------------------------------------- Blackcat

Deno.test("Blackcat pix: X-API-Key, centavos, copyPaste; status in centavos", async () => {
  const mock = mockFetch([
    {
      status: 201,
      body: {
        success: true,
        data: {
          transactionId: "txn_1",
          status: "PENDING",
          amount: 1990,
          paymentData: { qrCode: "000201BC", copyPaste: "000201BC", qrCodeBase64: "data:image/png;base64,AAA", expiresAt: "2026-09-28T00:00:00Z" },
        },
      },
    },
    { status: 200, body: { success: true, data: { status: "PAID", amount: 1990 } } },
  ]);
  try {
    const gw = new BlackcatGateway({ api_key: "bk" });
    const r = await gw.createCharge(input);
    assertEquals(r.paymentId, "txn_1");
    assertEquals(r.qrCode, "000201BC");
    assertEquals(r.qrCodeBase64, "AAA");
    const c = mock.calls[0]!;
    assertEquals(c.url, "https://api.blackcatoficial.com/api/sales/create-sale");
    assertEquals(header(c, "X-API-Key"), "bk");
    assertEquals(body(c).amount, 1990);
    assertEquals(body(c).externalRef, input.orderId);
    const info = await gw.getPayment("txn_1");
    assertEquals(mock.calls[1]!.url, "https://api.blackcatoficial.com/api/sales/txn_1/status");
    assertEquals(info.status, "approved");
    assertEquals(info.amount, 19.9);
  } finally {
    mock.restore();
  }
});

Deno.test("Blackcat: wrong amount rejected, refund points to the dashboard", async () => {
  assertEquals(bcStatus("REFUNDED"), "refunded");
  assertEquals(bcStatus("EXPIRED"), "expired");
  assertEquals(webhookSaleId({ data: { transactionId: "txn_9" } }), "txn_9");
  const mock = mockFetch([
    { status: 201, body: { data: { transactionId: "t", status: "PENDING", amount: 100, paymentData: { copyPaste: "x" } } } },
  ]);
  try {
    await assertRejects(() => new BlackcatGateway({ api_key: "k" }).createCharge(input), GatewayError, "valor diferente");
  } finally {
    mock.restore();
  }
  await assertRejects(() => new BlackcatGateway({ api_key: "k" }).refund("t"), GatewayError, "painel");
});

// --------------------------------------------------------------------- Stripe

Deno.test("Stripe formEncode uses bracket notation", () => {
  assertEquals(
    decodeURIComponent(formEncode({ a: 1, b: { c: "x", d: ["p", "q"] }, e: undefined })),
    "a=1&b[c]=x&b[d][0]=p&b[d][1]=q",
  );
});

Deno.test("Stripe pix: confirmed PaymentIntent with QR data", async () => {
  const mock = mockFetch([
    {
      status: 200,
      body: {
        id: "pi_1",
        status: "requires_action",
        amount: 1990,
        currency: "brl",
        next_action: { pix_display_qr_code: { data: "000201ST", expires_at: 1790000000, hosted_instructions_url: "https://h" } },
      },
    },
  ]);
  try {
    const r = await new StripeGateway({ secret_key: "sk_test_x" }, "sandbox").createCharge({ ...input, method: "pix" });
    assertEquals(r.paymentId, "pi_1");
    assertEquals(r.qrCode, "000201ST");
    assertEquals(r.status, "pending");
    const c = mock.calls[0]!;
    assertEquals(c.url, "https://api.stripe.com/v1/payment_intents");
    assertEquals(header(c, "Idempotency-Key"), `pavox-${input.orderId}-pix`);
    const form = new URLSearchParams(String(c.init.body));
    assertEquals(form.get("amount"), "1990");
    assertEquals(form.get("payment_method_types[0]"), "pix");
    assertEquals(form.get("confirm"), "true");
    assertEquals(form.get("metadata[order_id]"), input.orderId);
  } finally {
    mock.restore();
  }
});

Deno.test("Stripe boleto sends tax_id and address", async () => {
  const mock = mockFetch([
    {
      status: 200,
      body: {
        id: "pi_2",
        status: "requires_action",
        next_action: { boleto_display_details: { number: "2379", pdf: "https://pdf", hosted_voucher_url: "https://v", expires_at: 1790000000 } },
      },
    },
  ]);
  try {
    const r = await new StripeGateway({ secret_key: "sk_live_x" }, "production").createCharge({ ...input, method: "boleto" });
    assertEquals(r.digitableLine, "2379");
    assertEquals(r.ticketUrl, "https://pdf");
    const form = new URLSearchParams(String(mock.calls[0]!.init.body));
    assertEquals(form.get("payment_method_data[boleto][tax_id]"), "12345678909");
    assertEquals(form.get("payment_method_data[billing_details][address][postal_code]"), "01310100");
    assertEquals(form.get("payment_method_data[billing_details][address][country]"), "BR");
  } finally {
    mock.restore();
  }
});

Deno.test("Stripe status, refunded charge and webhook ids", () => {
  assertEquals(stStatus({ status: "succeeded", latest_charge: { refunded: false } }), "approved");
  assertEquals(stStatus({ status: "succeeded", latest_charge: { refunded: true } }), "refunded");
  assertEquals(stStatus({ status: "canceled" }), "cancelled");
  assertEquals(stStatus({ status: "requires_action" }), "pending");
  assertEquals(webhookIntentId({ data: { object: { object: "payment_intent", id: "pi_9" } } }), "pi_9");
  assertEquals(webhookIntentId({ data: { object: { object: "charge", id: "ch_1", payment_intent: "pi_9" } } }), "pi_9");
  assertEquals(webhookIntentId({ data: { object: { id: "cus_1" } } }), null);
});

Deno.test("Stripe: test key in production is an environment mismatch", async () => {
  const r = await new StripeGateway({ secret_key: "sk_test_x" }, "production").testConnection();
  assertEquals(r.status, "environment_mismatch");
});

// ------------------------------------------------------------------- Pagar.me

Deno.test("Pagar.me pix: order with customer, phone and qr_code", async () => {
  const mock = mockFetch([
    {
      status: 200,
      body: {
        id: "or_1",
        status: "pending",
        amount: 1990,
        charges: [{ id: "ch_1", status: "pending", last_transaction: { qr_code: "000201PM", qr_code_url: "https://img", expires_at: "2026-09-28" } }],
      },
    },
  ]);
  try {
    const r = await new PagarmeGateway({ secret_key: "sk_test_x" }, "sandbox").createCharge({ ...input, method: "pix" });
    assertEquals(r.paymentId, "or_1");
    assertEquals(r.qrCode, "000201PM");
    const c = mock.calls[0]!;
    assertEquals(c.url, "https://api.pagar.me/core/v5/orders");
    assertEquals(header(c, "Authorization"), `Basic ${btoa("sk_test_x:")}`);
    const b = body(c);
    assertEquals(b.items[0].amount, 1990);
    assertEquals(b.customer.document_type, "CPF");
    assertEquals(b.customer.phones.mobile_phone, { country_code: "55", area_code: "11", number: "912345678" });
    assertEquals(b.payments[0].payment_method, "pix");
  } finally {
    mock.restore();
  }
});

Deno.test("Pagar.me: failed order is rejected with the gateway reason", async () => {
  const mock = mockFetch([
    {
      status: 200,
      body: { id: "or_2", status: "failed", charges: [{ status: "failed", last_transaction: { gateway_response: { errors: [{ message: "CPF inválido" }] } } }] },
    },
  ]);
  try {
    await assertRejects(() => new PagarmeGateway({ secret_key: "sk_x" }, "production").createCharge(input), GatewayError, "CPF inválido");
  } finally {
    mock.restore();
  }
});

Deno.test("Pagar.me status, refund via charge cancel and webhook", async () => {
  assertEquals(pmStatus({ status: "paid", charges: [{ status: "paid" }] }), "approved");
  assertEquals(pmStatus({ charges: [{ status: "canceled", paid_at: "2026-09-26" }] }), "refunded");
  assertEquals(pmStatus({ charges: [{ status: "canceled" }] }), "cancelled");
  assertEquals(pmWebhook({ type: "order.paid", data: { id: "or_5" } }), "or_5");
  assertEquals(pmWebhook({ type: "charge.paid", data: { id: "ch_5", order: { id: "or_5" } } }), "or_5");
  const mock = mockFetch([
    { status: 200, body: { id: "or_1", amount: 1990, charges: [{ id: "ch_1", status: "paid" }] } },
    { status: 200, body: { id: "ch_1", status: "canceled" } },
  ]);
  try {
    const r = await new PagarmeGateway({ secret_key: "sk_x" }, "production").refund("or_1");
    assertEquals(r.status, "refunded");
    assertEquals(mock.calls[1]!.url, "https://api.pagar.me/core/v5/charges/ch_1");
    assertEquals(mock.calls[1]!.init.method, "DELETE");
  } finally {
    mock.restore();
  }
});

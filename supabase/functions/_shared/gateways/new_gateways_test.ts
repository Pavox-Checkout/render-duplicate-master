// deno test supabase/functions/_shared/gateways/new_gateways_test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { AppmaxGateway, normalize as appmaxStatus, webhookOrderId } from "./appmax.ts";
import { GaruGateway, normalize as garuStatus, webhookChargeId, type ProductRefStore } from "./garu.ts";
import { HOPYSPLIT_SANDBOX_URL, HopySplitGateway, normalize as hsStatus, postbackTransactionId } from "./hopysplit.ts";
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
  },
  product: { id: "9a6d41be-7a78-40f8-9580-992b44aabc95", name: "Produto", unitPrice: 19.9 },
  notificationUrl: "https://x.supabase.co/functions/v1/gateway-webhook?provider=beehive&store=u1",
  statementDescriptor: "LOJA",
  expiresAt: new Date("2026-09-26T15:30:00Z"),
};

const beehive = { name: "Beehive", productionUrl: "https://api.conta.paybeehive.com.br/v1", sandboxUrl: HOPYSPLIT_SANDBOX_URL };

// ---------------------------------------------------------------- HopySplit

Deno.test("registry: HopySplit brands, Appmax and Garu use the generic webhook", () => {
  for (const id of ["beehive", "axionpay", "pagou", "credwave", "hopysplit", "appmax", "garu"]) {
    const spec = providerSpec(id)!;
    assertEquals(spec.methods, ["pix", "boleto"]);
    assertEquals(typeof spec.webhookPaymentId, "function");
  }
  assertEquals(providerSpec("mercadopago")!.webhookPaymentId, undefined);
});

Deno.test("HopySplit pix: Basic auth, centavos, metadata and copia-e-cola", async () => {
  const mock = mockFetch([
    { status: 200, body: { id: 991, status: "waiting_payment", amount: 1990, secureUrl: "https://s/1", pix: { qrcode: "000201PIX", expirationDate: "2026-09-27" } } },
  ]);
  try {
    const gw = new HopySplitGateway(beehive, { secret_key: "sk_live_abc" }, "production");
    const r = await gw.createCharge({ ...input, method: "pix" });
    assertEquals(r.paymentId, "991");
    assertEquals(r.status, "pending");
    assertEquals(r.qrCode, "000201PIX");
    const call = mock.calls[0]!;
    assertEquals(call.url, "https://api.conta.paybeehive.com.br/v1/transactions");
    assertEquals((call.init.headers as Record<string, string>)["Authorization"], `Basic ${btoa("sk_live_abc:x")}`);
    const body = JSON.parse(String(call.init.body));
    assertEquals(body.amount, 1990);
    assertEquals(body.paymentMethod, "pix");
    assertEquals(body.customer.document, { type: "cpf", number: "12345678909" });
    assertEquals(body.customer.phone, "11912345678");
    assertEquals(body.items[0].unitPrice, 1990);
    assertEquals(body.postbackUrl, input.notificationUrl);
    assertEquals(body.metadata.orderId, input.orderId);
  } finally {
    mock.restore();
  }
});

Deno.test("HopySplit sandbox uses the platform sandbox; boleto parses the line", async () => {
  const mock = mockFetch([
    { status: 200, body: { id: 5, status: "waiting_payment", boleto: { url: "https://b/5", barcode: "2379", digitableLine: "23790.1", expirationDate: "2026-09-29" } } },
  ]);
  try {
    const gw = new HopySplitGateway(beehive, { secret_key: "sk_test" }, "sandbox");
    const r = await gw.createCharge({ ...input, method: "boleto" });
    assertEquals(mock.calls[0]!.url, `${HOPYSPLIT_SANDBOX_URL}/transactions`);
    assertEquals(r.digitableLine, "23790.1");
    assertEquals(r.ticketUrl, "https://b/5");
  } finally {
    mock.restore();
  }
});

Deno.test("HopySplit: missing phone/CPF rejected before any call; API errors surface", async () => {
  const gw = new HopySplitGateway(beehive, { secret_key: "k" }, "production");
  await assertRejects(() => gw.createCharge({ ...input, buyer: { ...input.buyer, phone: "" } }), GatewayError, "Telefone");
  await assertRejects(() => gw.createCharge({ ...input, buyer: { ...input.buyer, document: "" } }), GatewayError, "CPF");
  const mock = mockFetch([{ status: 400, body: { message: "Valor mínimo não atingido.", status: 400 } }]);
  try {
    const err = await assertRejects(() => gw.createCharge(input), GatewayError);
    assertEquals(err.code, "payment_rejected");
    assertEquals(err.message, "Valor mínimo não atingido.");
  } finally {
    mock.restore();
  }
});

Deno.test("HopySplit: status, getPayment in reais, refund, test connection, postback id", async () => {
  assertEquals(hsStatus("paid"), "approved");
  assertEquals(hsStatus("refused"), "rejected");
  assertEquals(hsStatus("chargedback"), "refunded");
  assertEquals(hsStatus("waiting_payment"), "pending");
  assertEquals(postbackTransactionId({ type: "transaction", data: { id: 42 } }), "42");
  assertEquals(postbackTransactionId({ objectId: "77" }), "77");
  assertEquals(postbackTransactionId({ id: "abc" }), null);
  const mock = mockFetch([
    { status: 200, body: { id: 42, status: "paid", amount: 1990, metadata: { orderId: input.orderId } } },
    { status: 200, body: { id: 42, status: "refunded" } },
    { status: 401, body: { message: "Token inválido.", status: 401 } },
    { status: 200, body: { name: "Loja da Maria" } },
  ]);
  try {
    const gw = new HopySplitGateway(beehive, { secret_key: "k" }, "production");
    assertEquals(await gw.getPayment("42"), {
      id: "42",
      status: "approved",
      rawStatus: "paid",
      amount: 19.9,
      currency: "BRL",
      externalReference: input.orderId,
    });
    assertEquals(await gw.refund("42"), { status: "refunded" });
    assertEquals(mock.calls[1]!.url, "https://api.conta.paybeehive.com.br/v1/transactions/42/refund");
    assertEquals((await gw.testConnection()).status, "invalid_credentials");
    assertEquals(await gw.testConnection(), { status: "connected", accountLabel: "Loja da Maria" });
    assertEquals(mock.calls[3]!.url, "https://api.conta.paybeehive.com.br/v1/company");
  } finally {
    mock.restore();
  }
});

// ------------------------------------------------------------------ Appmax

Deno.test("Appmax pix: customer → order → payment, token in the body", async () => {
  const mock = mockFetch([
    { status: 200, body: { success: true, status: 200, data: { id: 11 } } },
    { status: 200, body: { success: true, status: 200, data: { id: 22 } } },
    { status: 200, body: { success: true, status: 200, data: { pix_emv: "000201APPMAX", pix_qrcode: "data:image/png;base64,iVBOR", pix_expiration_date: "2026-09-26 15:30:00" } } },
  ]);
  try {
    const gw = new AppmaxGateway({ access_token: "tok" }, "production");
    const r = await gw.createCharge({ ...input, method: "pix" });
    assertEquals(r.paymentId, "22");
    assertEquals(r.qrCode, "000201APPMAX");
    assertEquals(r.qrCodeBase64, "iVBOR");
    assertEquals(mock.calls.map((c) => c.url), [
      "https://admin.appmax.com.br/api/v3/customer",
      "https://admin.appmax.com.br/api/v3/order",
      "https://admin.appmax.com.br/api/v3/payment/pix",
    ]);
    const customer = JSON.parse(String(mock.calls[0]!.init.body));
    assertEquals(customer["access-token"], "tok");
    assertEquals(customer.firstname, "Maria");
    const order = JSON.parse(String(mock.calls[1]!.init.body));
    assertEquals(order.total, 19.9);
    assertEquals(order.customer_id, 11);
    const payment = JSON.parse(String(mock.calls[2]!.init.body));
    assertEquals(payment.cart, { order_id: 22 });
    assertEquals(payment.payment.pix.document_number, "12345678909");
    assertEquals(payment.payment.pix.expiration_date, "2026-09-26 15:30:00");
  } finally {
    mock.restore();
  }
});

Deno.test("Appmax boleto, sandbox host, errors, status and webhook id", async () => {
  const mock = mockFetch([
    { status: 200, body: { success: true, status: 200, data: { id: 1 } } },
    { status: 200, body: { success: true, status: 200, data: { id: 2 } } },
    { status: 200, body: { success: true, status: 200, data: { digitable_line: "34191.1", pdf: "https://p.pdf", due_date: "2026-09-29" } } },
    { status: 400, body: { success: false, text: "CPF inválido" } },
  ]);
  try {
    const gw = new AppmaxGateway({ access_token: "tok" }, "sandbox");
    const r = await gw.createCharge({ ...input, method: "boleto" });
    assertEquals(mock.calls[0]!.url, "https://homolog.sandboxappmax.com.br/api/v3/customer");
    assertEquals(r.digitableLine, "34191.1");
    assertEquals(r.ticketUrl, "https://p.pdf");
    const err = await assertRejects(() => gw.createCharge(input), GatewayError);
    assertEquals(err.message, "CPF inválido");
  } finally {
    mock.restore();
  }
  assertEquals(appmaxStatus("aprovado"), "approved");
  assertEquals(appmaxStatus("integrado"), "approved");
  assertEquals(appmaxStatus("estornado"), "refunded");
  assertEquals(appmaxStatus("cancelado"), "cancelled");
  assertEquals(appmaxStatus("pendente"), "pending");
  assertEquals(webhookOrderId({ event: "OrderPaid", data: { id: 22 } }), "22");
  assertEquals(webhookOrderId({ data: {} }), null);
});

Deno.test("Appmax getPayment reads status and total; refund is total", async () => {
  const mock = mockFetch([
    { status: 200, body: { success: true, status: 200, data: { id: 22, status: "aprovado", total: 19.9 } } },
    { status: 200, body: { success: true, status: 200, data: {} } },
  ]);
  try {
    const gw = new AppmaxGateway({ access_token: "tok" }, "production");
    const info = await gw.getPayment("22");
    assertEquals(mock.calls[0]!.url, "https://admin.appmax.com.br/api/v3/order/22?access-token=tok");
    assertEquals([info.status, info.amount], ["approved", 19.9]);
    await gw.refund("22");
    assertEquals(JSON.parse(String(mock.calls[1]!.init.body)), { order_id: 22, refund_type: "total", "access-token": "tok" });
  } finally {
    mock.restore();
  }
});

// -------------------------------------------------------------------- Garu

function memoryStore(): ProductRefStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, get: (k) => Promise.resolve(map.get(k) ?? null), put: (k, v) => Promise.resolve(void map.set(k, v)) };
}

Deno.test("Garu pix: mirror product created once, idempotent charge, Bearer auth", async () => {
  const store = memoryStore();
  const mock = mockFetch([
    { status: 201, body: { uuid: "11111111-1111-4111-8111-111111111111" } },
    { status: 201, body: { uuid: "22222222-2222-4222-8222-222222222222", status: "pending", pix: { code: "000201GARU" } } },
    { status: 201, body: { uuid: "33333333-3333-4333-8333-333333333333", status: "pending", pix: { code: "000201GARU2" } } },
  ]);
  try {
    const gw = new GaruGateway({ api_key: "sk_live_x" }, "production", store);
    const r = await gw.createCharge({ ...input, method: "pix" });
    assertEquals(r.paymentId, "22222222-2222-4222-8222-222222222222");
    assertEquals(r.qrCode, "000201GARU");
    assertEquals(mock.calls[0]!.url, "https://garu.com.br/api/v1/products");
    assertEquals(JSON.parse(String(mock.calls[0]!.init.body)).value, 19.9);
    const charge = mock.calls[1]!;
    assertEquals(charge.url, "https://garu.com.br/api/v1/charges");
    const headers = charge.init.headers as Record<string, string>;
    assertEquals(headers["Authorization"], "Bearer sk_live_x");
    assertEquals(headers["X-Idempotency-Key"], `pavox-${input.orderId}-pix`);
    const body = JSON.parse(String(charge.init.body));
    assertEquals(body.productId, "11111111-1111-4111-8111-111111111111");
    assertEquals(body.customer.document, "12345678909");
    // Second sale of the same product/price reuses the mirror product.
    await gw.createCharge({ ...input, orderId: "8b0c2d3e-1111-4222-8333-944455556666" });
    assertEquals(mock.calls.length, 3);
    assertEquals(mock.calls[2]!.url, "https://garu.com.br/api/v1/charges");
  } finally {
    mock.restore();
  }
});

Deno.test("Garu: status, test key in production, webhook id", async () => {
  assertEquals(garuStatus("paid"), "approved");
  assertEquals(garuStatus("failed"), "rejected");
  assertEquals(garuStatus("canceled"), "cancelled");
  assertEquals(garuStatus("refund_pending"), "pending");
  assertEquals(garuStatus("chargeback"), "refunded");
  const gw = new GaruGateway({ api_key: "sk_test_x" }, "production");
  assertEquals((await gw.testConnection()).status, "environment_mismatch");
  const uuid = "22222222-2222-4222-8222-222222222222";
  assertEquals(webhookChargeId({ eventType: "transaction.payment.paid", data: { uuid } }), uuid);
  assertEquals(webhookChargeId({ payload: { transaction: { uuid } } }), uuid);
  assertEquals(webhookChargeId({ data: { uuid: "not-a-uuid" } }), null);
});

// deno test supabase/functions/_shared/gateways/asaas_test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { AsaasGateway, asaasSplitFee, brDate, normalize } from "./asaas.ts";
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
  notificationUrl: "https://example.supabase.co/functions/v1/asaas-webhook?store=u1",
  statementDescriptor: "LOJA",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
};

const key = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjAwMDAw";

Deno.test("normalize maps Asaas statuses", () => {
  assertEquals(normalize("RECEIVED"), "approved");
  assertEquals(normalize("CONFIRMED"), "approved");
  assertEquals(normalize("PENDING"), "pending");
  assertEquals(normalize("OVERDUE"), "expired");
  assertEquals(normalize("REFUNDED"), "refunded");
  assertEquals(normalize("REFUND_REQUESTED"), "pending");
  assertEquals(normalize("PENDING", true), "cancelled");
});

Deno.test("brDate uses the Brazil calendar day", () => {
  // 02:00 UTC on the 10th is still the 9th in São Paulo.
  assertEquals(brDate(0, Date.parse("2026-09-10T02:00:00Z")), "2026-09-09");
  assertEquals(brDate(3, Date.parse("2026-09-10T15:00:00Z")), "2026-09-13");
});

Deno.test("createCharge (pix) reuses the customer, creates the charge and reads the QR code", async () => {
  const mock = mockFetch([
    { status: 200, body: { data: [] } }, // no charge for this order yet
    { status: 200, body: { data: [{ id: "cus_1" }] } }, // customer found by CPF
    { status: 200, body: { id: "pay_1", status: "PENDING", value: 19.9, invoiceUrl: "https://asaas/i/pay_1" } },
    { status: 200, body: { payload: "000201PIX", encodedImage: "iVBOR", expirationDate: "2027-09-10 23:59:59" } },
  ]);
  try {
    const gw = new AsaasGateway({ api_key: key }, "sandbox");
    const pix = await gw.createCharge({ ...input, method: "pix" });
    assertEquals(pix.paymentId, "pay_1");
    assertEquals(pix.status, "pending");
    assertEquals(pix.qrCode, "000201PIX");
    assertEquals(pix.qrCodeBase64, "iVBOR");
    assertEquals(pix.ticketUrl, "https://asaas/i/pay_1");

    assertEquals(mock.calls[0]!.url, `https://api-sandbox.asaas.com/v3/payments?externalReference=${input.orderId}&limit=10`);
    assertEquals(mock.calls[1]!.url, "https://api-sandbox.asaas.com/v3/customers?cpfCnpj=12345678909&limit=10");
    const create = mock.calls[2]!;
    assertEquals(create.url, "https://api-sandbox.asaas.com/v3/payments");
    const headers = create.init.headers as Record<string, string>;
    assertEquals(headers["access_token"], key);
    assertEquals(headers["User-Agent"], "PAVOX");
    const body = JSON.parse(String(create.init.body));
    assertEquals(body.customer, "cus_1");
    assertEquals(body.billingType, "PIX");
    assertEquals(body.value, 19.9);
    assertEquals(body.externalReference, input.orderId);
    assertEquals(body.split, undefined);
    assertEquals(mock.calls[3]!.url, "https://api-sandbox.asaas.com/v3/payments/pay_1/pixQrCode");
  } finally {
    mock.restore();
  }
});

Deno.test("createCharge (boleto) creates the customer with address and reads the digitable line", async () => {
  const mock = mockFetch([
    { status: 200, body: { data: [] } },
    { status: 200, body: { data: [] } },
    { status: 200, body: { id: "cus_2" } },
    {
      status: 200,
      body: { id: "pay_2", status: "PENDING", value: 19.9, bankSlipUrl: "https://asaas/b/pay_2", dueDate: "2026-09-13" },
    },
    { status: 200, body: { identificationField: "23790.00000 1", barCode: "23790000" } },
  ]);
  try {
    const gw = new AsaasGateway({ api_key: key }, "production");
    const boleto = await gw.createCharge({
      ...input,
      method: "boleto",
      buyer: {
        ...input.buyer,
        address: { zip: "01001-000", street: "Praça da Sé", number: "1", neighborhood: "Sé", city: "São Paulo", state: "SP" },
      },
    });
    assertEquals(boleto.paymentId, "pay_2");
    assertEquals(boleto.digitableLine, "23790.00000 1");
    assertEquals(boleto.barcode, "23790000");
    assertEquals(boleto.ticketUrl, "https://asaas/b/pay_2");
    assertEquals(boleto.expiresAt, "2026-09-13T23:59:59-03:00");

    const customer = JSON.parse(String(mock.calls[2]!.init.body));
    assertEquals(customer.cpfCnpj, "12345678909");
    assertEquals(customer.postalCode, "01001000");
    assertEquals(customer.province, "Sé");
    assertEquals(customer.notificationDisabled, true);
    const charge = JSON.parse(String(mock.calls[3]!.init.body));
    assertEquals(charge.billingType, "BOLETO");
    assertEquals(mock.calls[3]!.url, "https://api.asaas.com/v3/payments");
  } finally {
    mock.restore();
  }
});

Deno.test("createCharge reuses a charge already created for the order (retry)", async () => {
  const mock = mockFetch([
    { status: 200, body: { data: [{ id: "pay_1", status: "PENDING", invoiceUrl: "https://asaas/i/pay_1" }] } },
    { status: 200, body: { payload: "000201PIX", encodedImage: "iVBOR" } },
  ]);
  try {
    const gw = new AsaasGateway({ api_key: key }, "sandbox");
    const pix = await gw.createCharge({ ...input, method: "pix" });
    assertEquals(pix.paymentId, "pay_1");
    assertEquals(mock.calls.length, 2);
  } finally {
    mock.restore();
  }
});

Deno.test("createCharge without CPF is rejected before calling Asaas to create", async () => {
  const mock = mockFetch([{ status: 200, body: { data: [] } }]);
  try {
    const gw = new AsaasGateway({ api_key: key }, "sandbox");
    await assertRejects(
      () => gw.createCharge({ ...input, buyer: { ...input.buyer, document: "" } }),
      GatewayError,
      "CPF/CNPJ",
    );
  } finally {
    mock.restore();
  }
});

Deno.test("Asaas errors become payment_rejected with the description", async () => {
  const mock = mockFetch([
    { status: 200, body: { data: [] } },
    { status: 200, body: { data: [{ id: "cus_1" }] } },
    { status: 400, body: { errors: [{ code: "invalid_value", description: "O valor mínimo é R$ 5,00." }] } },
  ]);
  try {
    const gw = new AsaasGateway({ api_key: key }, "sandbox");
    const err = await assertRejects(() => gw.createCharge({ ...input, amount: 1 }), GatewayError);
    assertEquals(err.code, "payment_rejected");
    assertEquals(err.message, "invalid_value | O valor mínimo é R$ 5,00.");
  } finally {
    mock.restore();
  }
});

Deno.test("split goes to the PAVOX wallet when configured", async () => {
  Deno.env.set("ASAAS_PLATFORM_WALLET_ID", "wal_pavox");
  const mock = mockFetch([
    { status: 200, body: { data: [] } },
    { status: 200, body: { data: [{ id: "cus_1" }] } },
    { status: 200, body: { id: "pay_1", status: "PENDING" } },
    { status: 200, body: { payload: "000201PIX" } },
  ]);
  try {
    assertEquals(asaasSplitFee({ wallet_id: "wal_store" }, 0.396), 0.4);
    assertEquals(asaasSplitFee({ wallet_id: "wal_pavox" }, 0.4), null);
    assertEquals(asaasSplitFee({}, 0), null);
    const gw = new AsaasGateway({ api_key: key }, "sandbox");
    await gw.createCharge({ ...input, marketplaceFee: 0.4 });
    const body = JSON.parse(String(mock.calls[2]!.init.body));
    assertEquals(body.split, [{ walletId: "wal_pavox", fixedValue: 0.4 }]);
  } finally {
    mock.restore();
    Deno.env.delete("ASAAS_PLATFORM_WALLET_ID");
  }
  assertEquals(asaasSplitFee({ wallet_id: "wal_store" }, 0.4), null);
});

Deno.test("testConnection: production with a sandbox key, 401 and a valid key", async () => {
  const gwProdTest = new AsaasGateway({ api_key: key }, "production");
  assertEquals((await gwProdTest.testConnection()).status, "environment_mismatch");

  const mock = mockFetch([
    { status: 401, body: {} },
    { status: 200, body: { companyName: "Loja da Maria" } },
  ]);
  try {
    const gw = new AsaasGateway({ api_key: key }, "sandbox");
    assertEquals((await gw.testConnection()).status, "invalid_credentials");
    assertEquals(await gw.testConnection(), { status: "connected", accountLabel: "Loja da Maria" });
    assertEquals(mock.calls[1]!.url, "https://api-sandbox.asaas.com/v3/myAccount/commercialInfo");
  } finally {
    mock.restore();
  }
});

Deno.test("ensureWebhook updates the existing PAVOX webhook instead of duplicating it", async () => {
  const url = "https://x.supabase.co/functions/v1/asaas-webhook?store=u1";
  const mock = mockFetch([
    { status: 200, body: { data: [{ id: "wh_other", url: "https://other" }, { id: "wh_1", url }] } },
    { status: 200, body: { id: "wh_1" } },
  ]);
  try {
    const gw = new AsaasGateway({ api_key: key }, "sandbox");
    await gw.ensureWebhook(url, "loja@example.com", "t".repeat(64));
    assertEquals(mock.calls[1]!.url, "https://api-sandbox.asaas.com/v3/webhooks/wh_1");
    assertEquals(mock.calls[1]!.init.method, "PUT");
    const body = JSON.parse(String(mock.calls[1]!.init.body));
    assertEquals(body.authToken, "t".repeat(64));
    assertEquals(body.url, url);
    assertEquals(body.enabled, true);
    assertEquals(body.events.includes("PAYMENT_RECEIVED"), true);
  } finally {
    mock.restore();
  }
});

Deno.test("refund and getPayment", async () => {
  const mock = mockFetch([
    { status: 200, body: { id: "pay_1", status: "REFUNDED" } },
    { status: 200, body: { id: "pay_1", status: "RECEIVED", value: 19.9, externalReference: input.orderId } },
  ]);
  try {
    const gw = new AsaasGateway({ api_key: key }, "sandbox");
    assertEquals(await gw.refund("pay_1"), { status: "refunded" });
    assertEquals(mock.calls[0]!.url, "https://api-sandbox.asaas.com/v3/payments/pay_1/refund");
    assertEquals(mock.calls[0]!.init.method, "POST");
    const info = await gw.getPayment("pay_1");
    assertEquals(info, {
      id: "pay_1",
      status: "approved",
      rawStatus: "RECEIVED",
      amount: 19.9,
      currency: "BRL",
      externalReference: input.orderId,
    });
  } finally {
    mock.restore();
  }
});

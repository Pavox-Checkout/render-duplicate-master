// deno test supabase/functions/_shared/gateways/mercadopago_test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { MercadoPagoGateway } from "./mercadopago.ts";
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

const pixInput = {
  orderId: "7b0c2d3e-1111-4222-8333-944455556666",
  reference: "PVX-ABCD1234",
  amount: 9.9,
  description: "Produto — pedido PVX-ABCD1234",
  buyer: { name: "Maria da Silva", email: "maria@example.com", phone: "(11) 91234-5678", document: "123.456.789-09", person_type: "pf" as const },
  product: { id: "9a6d41be-7a78-40f8-9580-992b44aabc95", name: "Produto", unitPrice: 9.9 },
  notificationUrl: "https://example.supabase.co/functions/v1/mercadopago-webhook?store=u1",
  statementDescriptor: "LOJA",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
};

Deno.test("createCharge (pix) sends an idempotent Orders request and parses the QR code", async () => {
  const mock = mockFetch([
    {
      status: 201,
      body: {
        id: "ORD01TEST",
        status: "action_required",
        status_detail: "waiting_transfer",
        transactions: {
          payments: [{ id: "PAY01", payment_method: { qr_code: "000201PIX", qr_code_base64: "iVBOR", ticket_url: "https://mp/t" } }],
        },
      },
    },
  ]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "APP_USR-x" }, "sandbox");
    const pix = await gw.createCharge(pixInput);
    assertEquals(pix.paymentId, "ORD01TEST");
    assertEquals(pix.status, "pending");
    assertEquals(pix.qrCode, "000201PIX");
    assertEquals(pix.qrCodeBase64, "iVBOR");

    const call = mock.calls[0]!;
    assertEquals(call.url, "https://api.mercadopago.com/v1/orders");
    const headers = call.init.headers as Record<string, string>;
    const body = JSON.parse(String(call.init.body));
    // Bound to the order and the exact body (≤ 64 chars), stable across retries.
    const key = headers["X-Idempotency-Key"]!;
    assertEquals(key.startsWith(`${pixInput.orderId}-`), true);
    assertEquals(key.length <= 64, true);
    assertEquals(body.transactions.payments[0].expiration_time, "PT30M");
    assertEquals(body.items[0].external_code.length <= 30, true);
    assertEquals(headers["Authorization"], "Bearer APP_USR-x");
    assertEquals(body.total_amount, "9.90");
    assertEquals(body.external_reference, pixInput.orderId);
    assertEquals(body.transactions.payments[0].payment_method, { id: "pix", type: "bank_transfer" });
    assertEquals(body.payer.identification, { type: "CPF", number: "12345678909" });
    assertEquals(body.payer.first_name, "Maria");
    assertEquals(body.payer.last_name, "da Silva");
    assertEquals(body.payer.phone, { area_code: "11", number: "912345678" });
  } finally {
    mock.restore();
  }
});

Deno.test("createCharge (pix) maps gateway errors", async () => {
  const mock = mockFetch([{ status: 401, body: { message: "invalid token" } }]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "bad" }, "sandbox");
    const err = await assertRejects(() => gw.createCharge(pixInput), GatewayError);
    assertEquals(err.code, "invalid_credentials");
  } finally {
    mock.restore();
  }
});

Deno.test("getPayment normalizes order statuses", async () => {
  const cases: Array<[string, string]> = [
    ["processed", "approved"],
    ["action_required", "pending"],
    ["failed", "rejected"],
    ["canceled", "cancelled"],
    ["expired", "expired"],
    ["refunded", "refunded"],
  ];
  for (const [raw, expected] of cases) {
    const mock = mockFetch([{ status: 200, body: { id: "ORD1", status: raw, total_amount: "9.90", external_reference: "o1" } }]);
    try {
      const info = await new MercadoPagoGateway({ access_token: "t" }, "sandbox").getPayment("ORD1");
      assertEquals(info.status, expected);
      assertEquals(info.amount, 9.9);
      assertEquals(info.currency, "BRL");
    } finally {
      mock.restore();
    }
  }
});

Deno.test("testConnection maps HTTP status and rejects test tokens in production", async () => {
  assertEquals(
    (await new MercadoPagoGateway({ access_token: "TEST-123" }, "production").testConnection()).status,
    "environment_mismatch",
  );
  for (const [status, expected] of [[401, "invalid_credentials"], [403, "permission_error"], [429, "rate_limited"], [503, "gateway_unavailable"]] as const) {
    const mock = mockFetch([{ status, body: {} }]);
    try {
      assertEquals((await new MercadoPagoGateway({ access_token: "t" }, "sandbox").testConnection()).status, expected);
    } finally {
      mock.restore();
    }
  }
  const ok = mockFetch([{ status: 200, body: { id: 1, nickname: "LOJA", site_id: "MLB" } }]);
  try {
    const res = await new MercadoPagoGateway({ access_token: "t" }, "sandbox").testConnection();
    assertEquals(res, { status: "connected", accountLabel: "LOJA" });
  } finally {
    ok.restore();
  }
});

Deno.test("createCharge (pix) sends marketplace_fee only when a split fee is given", async () => {
  const ok = {
    status: 201,
    body: { id: "ORD02", status: "action_required", transactions: { payments: [{ payment_method: { qr_code: "PIX" } }] } },
  };
  const mock = mockFetch([ok, structuredClone(ok)]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "APP_USR-x" }, "production");
    await gw.createCharge({ ...pixInput, marketplaceFee: 0.2 });
    await gw.createCharge({ ...pixInput, marketplaceFee: null });
    assertEquals(JSON.parse(String(mock.calls[0]!.init.body)).marketplace_fee, "0.20");
    assertEquals("marketplace_fee" in JSON.parse(String(mock.calls[1]!.init.body)), false);
  } finally {
    mock.restore();
  }
});

Deno.test("createCharge sends a tokenized card and returns the decided status", async () => {
  const mock = mockFetch([
    {
      status: 201,
      body: {
        id: "ORD03",
        status: "processed",
        transactions: { payments: [{ status: "processed", status_detail: "accredited", payment_method: { id: "master" } }] },
      },
    },
  ]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "APP_USR-x" }, "production");
    const res = await gw.createCharge({
      ...pixInput,
      method: "card",
      card: {
        token: "abcdef0123456789abcdef0123456789",
        paymentMethodId: "master",
        paymentTypeId: "credit_card",
        installments: 3,
        identification: { type: "CPF", number: "111.444.777-35" },
      },
    });
    assertEquals(res.status, "approved");
    assertEquals(res.statusDetail, "accredited");
    const body = JSON.parse(String(mock.calls[0]!.init.body));
    assertEquals(body.transactions.payments[0].payment_method, {
      id: "master",
      type: "credit_card",
      token: "abcdef0123456789abcdef0123456789",
      installments: 3,
    });
    assertEquals(body.payer.identification, { type: "CPF", number: "11144477735" });
    assertEquals("expiration_time" in body.transactions.payments[0], false);
  } finally {
    mock.restore();
  }
});

Deno.test("createCharge treats a declined card order as a result, not an error", async () => {
  const mock = mockFetch([
    {
      status: 402,
      body: {
        id: "ORD04",
        status: "failed",
        transactions: { payments: [{ status: "failed", status_detail: "rejected_by_issuer" }] },
      },
    },
  ]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "APP_USR-x" }, "production");
    const res = await gw.createCharge({
      ...pixInput,
      method: "card",
      card: { token: "abcdef0123456789abcdef0123456789", paymentMethodId: "visa", paymentTypeId: "credit_card", installments: 1 },
    });
    assertEquals(res.status, "rejected");
    assertEquals(res.statusDetail, "rejected_by_issuer");
  } finally {
    mock.restore();
  }
});

Deno.test("createCharge refuses a card charge without a token", async () => {
  const gw = new MercadoPagoGateway({ access_token: "APP_USR-x" }, "production");
  await assertRejects(() => gw.createCharge({ ...pixInput, method: "card" }), GatewayError);
});

Deno.test("createCharge sends boleto with the payer address and returns the digitable line", async () => {
  const mock = mockFetch([
    {
      status: 201,
      body: {
        id: "ORD05",
        status: "action_required",
        transactions: {
          payments: [
            {
              status: "action_required",
              date_of_expiration: "2026-10-01T23:59:59.000-03:00",
              payment_method: { ticket_url: "https://mp/boleto", digitable_line: "2379338", barcode_content: "2379" },
            },
          ],
        },
      },
    },
  ]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "APP_USR-x" }, "production");
    const res = await gw.createCharge({
      ...pixInput,
      method: "boleto",
      buyer: {
        ...pixInput.buyer,
        address: { zip: "93420-533", street: "Rua A", number: "", neighborhood: "Centro", city: "Novo Hamburgo", state: "RS" },
      },
    });
    assertEquals(res.status, "pending");
    assertEquals(res.digitableLine, "2379338");
    assertEquals(res.ticketUrl, "https://mp/boleto");
    assertEquals(res.expiresAt, "2026-10-01T23:59:59.000-03:00");
    const body = JSON.parse(String(mock.calls[0]!.init.body));
    assertEquals(body.transactions.payments[0].payment_method, { id: "boleto", type: "ticket" });
    assertEquals(body.transactions.payments[0].expiration_time, "P3D");
    assertEquals(body.payer.address, {
      zip_code: "93420533",
      street_name: "Rua A",
      street_number: "S/N",
      neighborhood: "Centro",
      city: "Novo Hamburgo",
      state: "RS",
    });
  } finally {
    mock.restore();
  }
});

Deno.test("refund posts an idempotent full refund and maps the status", async () => {
  const mock = mockFetch([{ status: 201, body: { id: "ORD06", status: "refunded" } }]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "APP_USR-x" }, "production");
    const res = await gw.refund("ORD06");
    assertEquals(res.status, "refunded");
    const call = mock.calls[0]!;
    assertEquals(call.url, "https://api.mercadopago.com/v1/orders/ORD06/refund");
    assertEquals(call.init.method, "POST");
    assertEquals((call.init.headers as Record<string, string>)["X-Idempotency-Key"], "refund-ORD06");
    assertEquals(call.init.body, undefined);
  } finally {
    mock.restore();
  }
});

Deno.test("refund surfaces Mercado Pago errors", async () => {
  const mock = mockFetch([{ status: 400, body: { errors: [{ code: "refund_not_allowed", message: "Refund window expired" }] } }]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "APP_USR-x" }, "production");
    const err = await assertRejects(() => gw.refund("ORD07"), GatewayError);
    assertEquals(err.code, "payment_rejected");
    assertEquals(err.message.includes("Refund window expired"), true);
  } finally {
    mock.restore();
  }
});

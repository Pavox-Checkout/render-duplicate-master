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
  product: { id: "p1", name: "Produto", unitPrice: 9.9 },
  notificationUrl: "https://example.supabase.co/functions/v1/mercadopago-webhook?store=u1",
  statementDescriptor: "LOJA",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
};

Deno.test("createPix sends an idempotent Orders request and parses the QR code", async () => {
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
    const pix = await gw.createPix(pixInput);
    assertEquals(pix.paymentId, "ORD01TEST");
    assertEquals(pix.status, "pending");
    assertEquals(pix.qrCode, "000201PIX");
    assertEquals(pix.qrCodeBase64, "iVBOR");

    const call = mock.calls[0]!;
    assertEquals(call.url, "https://api.mercadopago.com/v1/orders");
    const headers = call.init.headers as Record<string, string>;
    assertEquals(headers["X-Idempotency-Key"], pixInput.orderId);
    assertEquals(headers["Authorization"], "Bearer APP_USR-x");
    const body = JSON.parse(String(call.init.body));
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

Deno.test("createPix maps gateway errors", async () => {
  const mock = mockFetch([{ status: 401, body: { message: "invalid token" } }]);
  try {
    const gw = new MercadoPagoGateway({ access_token: "bad" }, "sandbox");
    const err = await assertRejects(() => gw.createPix(pixInput), GatewayError);
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

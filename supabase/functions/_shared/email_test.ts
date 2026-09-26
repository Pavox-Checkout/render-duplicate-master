// deno test supabase/functions/_shared/email_test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { EmailError, escapeHtml, orderEmail, sendEmail } from "./email.ts";

const base = {
  kind: "paid" as const,
  storeName: "Loja <Teste>",
  buyerName: "Maria <script>alert(1)</script> Silva",
  buyerEmail: "maria@example.com",
  reference: "PVX-ABC123",
  productName: "Kit & Cia",
  amount: 197,
  method: "card",
  installments: 3,
};

Deno.test("escapeHtml neutralizes markup", () => {
  assertEquals(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});

Deno.test("paid e-mail shows the order and escapes buyer/store data", () => {
  const { subject, html, text } = orderEmail(base);
  assertEquals(subject, "Pagamento confirmado — pedido PVX-ABC123");
  assertEquals(html.includes("<script>"), false);
  assertEquals(html.includes("Loja &lt;Teste&gt;"), true);
  assertEquals(html.includes("Kit &amp; Cia"), true);
  assertEquals(text.includes("Cartão de crédito em 3x"), true);
  assertEquals(text.includes("R$"), true);
});

Deno.test("refunded e-mail has its own subject", () => {
  assertEquals(orderEmail({ ...base, kind: "refunded" }).subject, "Pagamento reembolsado — pedido PVX-ABC123");
});

Deno.test("sendEmail calls Brevo with the store as sender name", async () => {
  const original = globalThis.fetch;
  let sent: { url: string; headers: Record<string, string>; body: Record<string, unknown> } | null = null;
  globalThis.fetch = ((url: string, init: RequestInit) => {
    sent = { url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) };
    return Promise.resolve(new Response(JSON.stringify({ messageId: "<m1>" }), { status: 201 }));
  }) as typeof fetch;
  try {
    const id = await sendEmail(
      { apiKey: "xkeysib-test", fromEmail: "no-reply@pavox.com", fromName: "PAVOX" },
      { to: "maria@example.com", toName: "Maria", subject: "s", html: "<p>h</p>", text: "t", senderName: "Minha Loja" },
    );
    assertEquals(id, "<m1>");
    assertEquals(sent!.url, "https://api.brevo.com/v3/smtp/email");
    assertEquals(sent!.headers["api-key"], "xkeysib-test");
    assertEquals(sent!.body["sender"], { email: "no-reply@pavox.com", name: "Minha Loja" });
    assertEquals(sent!.body["to"], [{ email: "maria@example.com", name: "Maria" }]);
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test("sendEmail surfaces Brevo errors", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify({ code: "unauthorized", message: "Key not found" }), { status: 401 }))) as typeof fetch;
  try {
    await assertRejects(
      () => sendEmail({ apiKey: "bad", fromEmail: "a@b.c", fromName: "P" }, { to: "x@y.z", subject: "s", html: "h", text: "t" }),
      EmailError,
    );
  } finally {
    globalThis.fetch = original;
  }
});

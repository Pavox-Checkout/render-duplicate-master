// deno test supabase/functions/_shared/domains_test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { normalizeHostname } from "./hostname.ts";
import { checkDomain } from "./vercel.ts";

Deno.test("normalizeHostname accepts real domains and rejects platform hosts", () => {
  assertEquals(normalizeHostname(" https://Checkout.MinhaLoja.com.br/pagar?x=1 "), "checkout.minhaloja.com.br");
  assertEquals(normalizeHostname("loja.com.br."), "loja.com.br");
  assertEquals(normalizeHostname("loja.com:443"), "loja.com");
  assertEquals(normalizeHostname("pavox-checkout-zeta.vercel.app"), null);
  assertEquals(normalizeHostname("abc.supabase.co"), null);
  assertEquals(normalizeHostname("localhost"), null);
  assertEquals(normalizeHostname("192.168.0.1"), null);
  assertEquals(normalizeHostname("sem espaço.com"), null);
});

function mockVercel(responses: Record<string, unknown>) {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${new URL(url).pathname}`;
    calls.push(key);
    const body = responses[key] ?? {};
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

Deno.test("checkDomain returns CNAME + TXT for an unverified subdomain", async () => {
  Deno.env.set("VERCEL_TOKEN", "t");
  const mock = mockVercel({
    "GET /v9/projects/prj_zI56GqfIZPUHeBpYfjkUsSr8ZKw1/domains/checkout.loja.com.br": {
      name: "checkout.loja.com.br",
      apexName: "loja.com.br",
      verified: false,
      verification: [{ type: "TXT", domain: "_vercel.loja.com.br", value: "vc-domain-verify=abc", reason: "pending" }],
    },
    "POST /v9/projects/prj_zI56GqfIZPUHeBpYfjkUsSr8ZKw1/domains/checkout.loja.com.br/verify": { verified: false },
    "GET /v6/domains/checkout.loja.com.br/config": {
      misconfigured: true,
      recommendedCNAME: [{ rank: 2, value: "other.vercel-dns.com" }, { rank: 1, value: "abc.vercel-dns-017.com." }],
    },
  });
  try {
    const res = await checkDomain("checkout.loja.com.br");
    assertEquals(res.verified, false);
    assertEquals(res.misconfigured, true);
    assertEquals(res.records, [
      { type: "CNAME", name: "checkout", value: "abc.vercel-dns-017.com", purpose: "routing" },
      { type: "TXT", name: "_vercel.loja.com.br", value: "vc-domain-verify=abc", purpose: "ownership" },
    ]);
  } finally {
    mock.restore();
  }
});

Deno.test("checkDomain returns A record for an apex domain and marks it configured", async () => {
  Deno.env.set("VERCEL_TOKEN", "t");
  const mock = mockVercel({
    "GET /v9/projects/prj_zI56GqfIZPUHeBpYfjkUsSr8ZKw1/domains/loja.com.br": {
      name: "loja.com.br",
      apexName: "loja.com.br",
      verified: true,
    },
    "GET /v6/domains/loja.com.br/config": { misconfigured: false, recommendedIPv4: [{ rank: 1, value: ["76.76.21.21"] }] },
  });
  try {
    const res = await checkDomain("loja.com.br");
    assertEquals(res, {
      verified: true,
      misconfigured: false,
      records: [{ type: "A", name: "@", value: "76.76.21.21", purpose: "routing" }],
    });
    assertEquals(mock.calls.some((c) => c.endsWith("/verify")), false);
  } finally {
    mock.restore();
  }
});

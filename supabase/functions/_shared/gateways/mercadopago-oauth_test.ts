// deno test supabase/functions/_shared/gateways/mercadopago-oauth_test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import {
  authorizationUrl,
  exchangeCode,
  needsRefresh,
  oauthCredentials,
  splitFee,
  type OAuthConfig,
} from "./mercadopago-oauth.ts";
import { GatewayError } from "./types.ts";
import { isAllowedReturnOrigin } from "../return-origin.ts";

const config: OAuthConfig = {
  clientId: "751778378668882",
  clientSecret: "secret",
  redirectUri: "https://x.supabase.co/functions/v1/mercadopago-oauth",
};
const DAY = 24 * 60 * 60 * 1000;

Deno.test("authorizationUrl points to Mercado Pago Brazil with state and redirect", () => {
  const url = new URL(authorizationUrl(config, "abc"));
  assertEquals(url.origin, "https://auth.mercadopago.com.br");
  assertEquals(url.searchParams.get("client_id"), "751778378668882");
  assertEquals(url.searchParams.get("response_type"), "code");
  assertEquals(url.searchParams.get("state"), "abc");
  assertEquals(url.searchParams.get("redirect_uri"), config.redirectUri);
});

Deno.test("exchangeCode posts the code and normalizes the tokens", async () => {
  const original = globalThis.fetch;
  let sent: Record<string, string> = {};
  globalThis.fetch = ((_url: string, init: RequestInit) => {
    sent = JSON.parse(String(init.body));
    return Promise.resolve(
      new Response(
        JSON.stringify({
          access_token: "APP_USR-a",
          public_key: "APP_USR-p",
          refresh_token: "TG-r",
          user_id: 123,
          live_mode: true,
          expires_in: 15552000,
        }),
        { status: 200 },
      ),
    );
  }) as typeof fetch;
  try {
    const tokens = await exchangeCode(config, "TG-code", 0);
    assertEquals(sent["grant_type"], "authorization_code");
    assertEquals(sent["code"], "TG-code");
    assertEquals(sent["redirect_uri"], config.redirectUri);
    assertEquals(tokens.user_id, "123");
    assertEquals(tokens.expires_at, new Date(15552000 * 1000).toISOString());
    assertEquals(oauthCredentials(tokens)["oauth"], "true");
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test("exchangeCode maps a rejected code to invalid_credentials", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify({ message: "invalid_grant" }), { status: 400 }))) as typeof fetch;
  try {
    const err = await assertRejects(() => exchangeCode(config, "bad"), GatewayError);
    assertEquals(err.code, "invalid_credentials");
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test("needsRefresh only for OAuth tokens within 30 days of expiring", () => {
  const now = 1_000 * DAY;
  const at = (days: number) => new Date(now + days * DAY).toISOString();
  assertEquals(needsRefresh({ oauth: "true", refresh_token: "r", expires_at: at(10) }, now), true);
  assertEquals(needsRefresh({ oauth: "true", refresh_token: "r", expires_at: at(90) }, now), false);
  assertEquals(needsRefresh({ access_token: "manual", expires_at: at(1) }, now), false);
});

Deno.test("splitFee applies only to OAuth sellers other than the marketplace owner", () => {
  assertEquals(splitFee({ oauth: "true", mp_user_id: "999" }, 0.199), 0.2);
  assertEquals(splitFee({ access_token: "manual" }, 1), null);
  assertEquals(splitFee({ oauth: "true", mp_user_id: "3662516384" }, 1), null);
  assertEquals(splitFee({ oauth: "true", mp_user_id: "999" }, 0), null);
});

Deno.test("return origin allowlist", () => {
  assertEquals(isAllowedReturnOrigin("https://pavox-checkout-zeta.vercel.app"), true);
  assertEquals(isAllowedReturnOrigin("http://localhost:5173"), true);
  assertEquals(isAllowedReturnOrigin("https://evil.example.com"), false);
  assertEquals(isAllowedReturnOrigin("http://pavox-checkout-zeta.vercel.app"), false);
  assertEquals(isAllowedReturnOrigin("https://pavox-checkout-zeta.vercel.app/x"), false);
});

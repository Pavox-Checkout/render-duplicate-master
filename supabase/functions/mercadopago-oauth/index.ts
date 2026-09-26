// "Conectar com Mercado Pago" (OAuth).
//
// POST { action: "start", returnTo }  (logged-in merchant)
//   → creates a single-use state and returns the Mercado Pago authorization URL.
// GET ?code=…&state=…                 (Mercado Pago redirects the browser here)
//   → exchanges the code for the seller's tokens, verifies them, stores them in
//     Vault and sends the merchant back to /integracoes?mp=connected|<error>.
//
// verify_jwt = false: the callback is a plain browser redirect. The state
// (random, stored only as a hash, 10 minutes, single use) ties it to the merchant.
import { admin, CORS_HEADERS, error, json, log, str } from "../_shared/http.ts";
import {
  authorizationUrl,
  exchangeCode,
  oauthConfig,
  oauthCredentials,
} from "../_shared/gateways/mercadopago-oauth.ts";
import { MercadoPagoGateway } from "../_shared/gateways/mercadopago.ts";
import { isAllowedReturnOrigin } from "../_shared/return-origin.ts";

const PROVIDER = "mercadopago";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function currentUserId(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error: authError } = await admin.auth.getUser(token);
  return authError || !data.user ? null : data.user.id;
}

function backTo(origin: string, result: string): Response {
  const url = new URL("/integracoes", origin);
  url.searchParams.set("mp", result);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

function plainError(message: string, status = 400): Response {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function handleStart(req: Request): Promise<Response> {
  const userId = await currentUserId(req);
  if (!userId) return error("unauthorized", "Sessão expirada. Faça login novamente.", 401);

  const config = oauthConfig();
  if (!config) {
    log("integration.failed", { store_id: userId, provider: PROVIDER, status: "oauth_not_configured" });
    return error(
      "oauth_not_configured",
      "A conexão automática com o Mercado Pago ainda não foi configurada na PAVOX. Use as chaves manualmente por enquanto.",
      503,
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // empty body
  }
  let returnOrigin = "";
  try {
    returnOrigin = new URL(str(body["returnTo"], 300)).origin;
  } catch {
    returnOrigin = "";
  }
  if (!isAllowedReturnOrigin(returnOrigin)) return error("invalid_request", "Origem inválida.", 400);

  // Housekeeping: states are short-lived.
  await admin.from("integration_oauth_states").delete().lt("expires_at", new Date(Date.now() - 86_400_000).toISOString());

  const state = randomState();
  const { error: insertError } = await admin.from("integration_oauth_states").insert({
    state_hash: await sha256Hex(state),
    user_id: userId,
    provider: PROVIDER,
    return_origin: returnOrigin,
  });
  if (insertError) {
    log("integration.failed", { store_id: userId, provider: PROVIDER, status: "state_error", detail: insertError.message });
    return error("internal_error", "Não foi possível iniciar a conexão. Tente novamente.", 500);
  }

  log("integration.oauth_started", { store_id: userId, provider: PROVIDER });
  return json({ url: authorizationUrl(config, state) });
}

async function handleCallback(url: URL): Promise<Response> {
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  if (!state || state.length > 200) return plainError("Link de conexão inválido. Volte à PAVOX e tente de novo.");

  const { data: consumed } = await admin.rpc("pavox_consume_oauth_state", { p_state_hash: await sha256Hex(state) });
  const owner = consumed as { user_id: string; provider: string; return_origin: string } | null;
  if (!owner || owner.provider !== PROVIDER) {
    log("webhook.invalid", { provider: PROVIDER, reason: "oauth_state_invalid" });
    return plainError("Este link de conexão expirou ou já foi usado. Volte à PAVOX e clique em Conectar de novo.");
  }
  const userId = owner.user_id;
  const origin = owner.return_origin;

  // The merchant clicked "Cancelar" on Mercado Pago, or no code came back.
  if (!code || url.searchParams.get("error")) {
    log("integration.failed", { store_id: userId, provider: PROVIDER, status: "oauth_denied" });
    return backTo(origin, "denied");
  }

  const config = oauthConfig();
  if (!config) return backTo(origin, "not_configured");

  try {
    const tokens = await exchangeCode(config, code);
    const environment = tokens.live_mode ? "production" : "sandbox";
    const credentials = oauthCredentials(tokens);

    // Same verification as a manual connection: authenticated call + Brazil account.
    const check = await new MercadoPagoGateway(credentials as { access_token: string }, environment).testConnection();
    if (check.status !== "connected") {
      log("integration.failed", { store_id: userId, provider: PROVIDER, status: check.status });
      return backTo(origin, check.status === "permission_error" ? "not_brazil" : "error");
    }

    // Keep the methods already chosen; Pix is the only one live today.
    const { data: existing } = await admin
      .from("payment_integrations")
      .select("enabled_payment_methods")
      .eq("user_id", userId)
      .eq("provider", PROVIDER)
      .maybeSingle();
    const methods = ((existing?.enabled_payment_methods as string[] | null) ?? []).filter((m) => m === "pix");

    const { error: saveError } = await admin.rpc("pavox_save_integration", {
      p_user_id: userId,
      p_provider: PROVIDER,
      p_environment: environment,
      p_methods: methods.length ? methods : ["pix"],
      p_credentials: credentials,
      p_masked: { access_token: "Conectado pelo Mercado Pago" },
      p_account_label: check.accountLabel ?? "",
      p_connection_type: "oauth",
      p_external_account_id: tokens.user_id,
      p_token_expires_at: tokens.expires_at,
    });
    if (saveError) throw new Error(saveError.message);

    log("integration.connected", { store_id: userId, provider: PROVIDER, environment, connection: "oauth" });
    return backTo(origin, "connected");
  } catch (err) {
    log("integration.failed", {
      store_id: userId,
      provider: PROVIDER,
      status: "oauth_exchange_failed",
      detail: err instanceof Error ? err.message : String(err),
    });
    return backTo(origin, "error");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  try {
    if (req.method === "GET") return await handleCallback(new URL(req.url));
    if (req.method === "POST") return await handleStart(req);
    return error("method_not_allowed", "Método não permitido.", 405);
  } catch (err) {
    log("integration.failed", { provider: PROVIDER, status: "internal_error", detail: err instanceof Error ? err.message : String(err) });
    return req.method === "GET"
      ? plainError("Não foi possível concluir a conexão. Volte à PAVOX e tente de novo.", 500)
      : error("internal_error", "Não foi possível iniciar a conexão. Tente novamente.", 500);
  }
});

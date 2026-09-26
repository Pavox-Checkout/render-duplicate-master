// Merchant-side gateway integrations (requires a logged-in merchant).
//
// POST { action: "save", provider, environment, methods, credentials }
//   → validates the credentials against the gateway API, stores them in Vault.
// POST { action: "test", provider }
//   → re-validates the stored credentials against the gateway API.
//
// Secrets never come back in any response — only status and masked hints.
import { admin, CORS_HEADERS, error, json, log, str } from "../_shared/http.ts";
import { gatewayFor, providerSpec, SetupError } from "../_shared/gateways/registry.ts";
import type { ConnectionStatus } from "../_shared/gateways/types.ts";
import { loadConnection, webhookUrl } from "../_shared/payments.ts";

const CONNECTION_MESSAGES: Record<ConnectionStatus, { status: number; message: string }> = {
  connected: { status: 200, message: "Conexão verificada com o gateway." },
  invalid_credentials: { status: 422, message: "Credenciais inválidas. Confira a chave copiada do gateway." },
  expired_credentials: { status: 422, message: "Credenciais expiradas. Gere novas credenciais no gateway." },
  permission_error: { status: 422, message: "A conta não tem permissão para receber pagamentos no Brasil." },
  gateway_unavailable: { status: 503, message: "O gateway não respondeu. Tente novamente em instantes." },
  rate_limited: { status: 429, message: "Muitas tentativas. Aguarde um minuto e tente de novo." },
  environment_mismatch: {
    status: 422,
    message: "Esta credencial é de teste (sandbox). Use as credenciais de produção ou escolha o ambiente de teste.",
  },
  unknown_error: { status: 502, message: "Não foi possível validar as credenciais agora." },
};

function mask(value: string) {
  const v = value.trim();
  return v.length <= 4 ? "••••" : `•••• ${v.slice(-4)}`;
}

async function currentUserId(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error: authError } = await admin.auth.getUser(token);
  return authError || !data.user ? null : data.user.id;
}

async function storedCredentials(userId: string, provider: string) {
  const { data } = await admin.rpc("pavox_get_integration_credentials", { p_user_id: userId, p_provider: provider });
  return (data ?? null) as { environment: string; credentials: Record<string, string> } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return error("method_not_allowed", "Método não permitido.", 405);

  const userId = await currentUserId(req);
  if (!userId) return error("unauthorized", "Sessão expirada. Faça login novamente.", 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return error("invalid_request", "Requisição inválida.", 400);
  }

  const provider = str(body["provider"], 32);
  const spec = providerSpec(provider);
  if (!spec) return error("provider_unavailable", "Este gateway ainda não está disponível na PAVOX.", 422);

  if (body["action"] === "test") {
    const stored = await storedCredentials(userId, provider);
    if (!stored) return error("not_found", "Integração não encontrada.", 404);
    // Same path as a charge: an OAuth token close to expiring is renewed here.
    const { gateway } = await loadConnection(userId, provider);
    const result = await gateway.testConnection();
    const { data: integration } = await admin.rpc("pavox_record_integration_test", {
      p_user_id: userId,
      p_provider: provider,
      p_result: result.status,
    });
    log(result.status === "connected" ? "integration.tested" : "integration.failed", {
      store_id: userId,
      provider,
      status: result.status,
    });
    const info = CONNECTION_MESSAGES[result.status];
    return json({ integration, result: result.status, message: info.message });
  }

  if (body["action"] !== "save") return error("invalid_request", "Ação inválida.", 400);

  const environment = body["environment"] === "production" ? "production" : "sandbox";
  const methods = (Array.isArray(body["methods"]) ? body["methods"] : [])
    .map((m) => String(m))
    .filter((m) => spec.methods.includes(m));
  if (methods.length === 0) return error("invalid_request", "Selecione ao menos um método disponível.", 422);

  // Blank fields on edit keep the stored value.
  const typed = (body["credentials"] && typeof body["credentials"] === "object"
    ? body["credentials"]
    : {}) as Record<string, unknown>;
  const stored = (await storedCredentials(userId, provider))?.credentials ?? {};
  // Switching from "Conectar com Mercado Pago" to manual keys: the OAuth token
  // is not reused as if it were a pasted key.
  const previous = stored["oauth"] === "true" ? {} : stored;
  const credentials: Record<string, string> = {};
  for (const key of spec.requiredCredentials) {
    const value = str(typed[key], 512).trim() || previous[key] || "";
    if (!value) return error("invalid_request", "Preencha todas as credenciais.", 422);
    credentials[key] = value;
  }

  const gateway = gatewayFor(provider, credentials, environment)!;
  const result = await gateway.testConnection();
  if (result.status !== "connected") {
    log("integration.failed", { store_id: userId, provider, status: result.status });
    const info = CONNECTION_MESSAGES[result.status];
    return error(result.status, info.message, info.status);
  }

  const masked = Object.fromEntries(Object.entries(credentials).map(([k, v]) => [k, mask(v)]));

  // Provider-specific setup (e.g. Asaas: register the PAVOX webhook).
  let extra: Record<string, string> = {};
  if (spec.onConnect) {
    const { data: user } = await admin.auth.admin.getUserById(userId);
    try {
      extra = await spec.onConnect(credentials, environment, {
        webhookUrl: webhookUrl(provider, userId),
        email: user?.user?.email ?? "",
        methods,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      log("integration.failed", { store_id: userId, provider, status: "setup_error", detail });
      if (err instanceof SetupError) return error("setup_failed", detail, 422);
      return error("setup_failed", "Não foi possível concluir a conexão com o gateway.", 502);
    }
  }
  const { data: integration, error: saveError } = await admin.rpc("pavox_save_integration", {
    p_user_id: userId,
    p_provider: provider,
    p_environment: environment,
    p_methods: methods,
    p_credentials: { ...credentials, ...extra },
    p_masked: masked,
    p_account_label: result.accountLabel ?? "",
    p_connection_type: "manual",
  });
  if (saveError) {
    log("integration.failed", { store_id: userId, provider, status: "save_error", detail: saveError.message });
    return error("save_failed", "Não foi possível salvar a integração.", 500);
  }

  log("integration.connected", { store_id: userId, provider, environment });
  return json({ integration, webhookUrl: webhookUrl(provider, userId) });
});

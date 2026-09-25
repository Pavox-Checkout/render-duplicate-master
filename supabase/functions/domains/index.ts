// Merchant custom domains (requires a logged-in merchant).
//
// POST { action: "add", hostname, checkoutId? } → saves the domain, attaches it
//   to the Vercel project and returns the DNS records the merchant must create.
// POST { action: "verify", domainId }            → re-checks DNS/ownership on Vercel.
// POST { action: "remove", domainId }            → detaches from Vercel and deletes.
//
// A domain is only "active" after Vercel confirms ownership and DNS; Vercel
// then issues the HTTPS certificate automatically.
import { admin, CORS_HEADERS, error, json, log, str } from "../_shared/http.ts";
import { addDomain, checkDomain, removeDomain, VercelError } from "../_shared/vercel.ts";
import { normalizeHostname } from "../_shared/hostname.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DB_ERRORS: Record<string, { status: number; message: string }> = {
  domain_taken: { status: 409, message: "Este domínio já está cadastrado na PAVOX." },
  domain_limit_reached: { status: 409, message: "Você atingiu o limite de domínios do seu plano." },
  checkout_not_found: { status: 404, message: "Checkout não encontrado." },
  domain_not_found: { status: 404, message: "Domínio não encontrado." },
};

const VERCEL_ERRORS: Record<VercelError["code"], { status: number; message: string }> = {
  not_configured: { status: 503, message: "Domínios próprios ainda não foram habilitados pela PAVOX." },
  domain_in_use: { status: 409, message: "Este domínio já está ligado a outro site. Remova-o de lá antes de conectar." },
  invalid_domain: { status: 422, message: "Domínio inválido." },
  unauthorized: { status: 503, message: "Serviço de domínios indisponível no momento." },
  unavailable: { status: 503, message: "Serviço de domínios indisponível no momento. Tente novamente." },
  unknown: { status: 502, message: "Não foi possível configurar o domínio agora." },
};

async function currentUserId(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error: authError } = await admin.auth.getUser(token);
  return authError || !data.user ? null : data.user.id;
}

function vercelError(err: unknown) {
  if (err instanceof VercelError) {
    const info = VERCEL_ERRORS[err.code];
    return error(err.code, info.message, info.status);
  }
  return error("internal_error", "Não foi possível concluir. Tente novamente.", 500);
}

async function refresh(domainId: string, hostname: string) {
  try {
    const check = await checkDomain(hostname);
    const status = check.verified && !check.misconfigured ? "active" : "pending_dns";
    const { data } = await admin.rpc("pavox_update_domain_status", {
      p_domain_id: domainId,
      p_status: status,
      p_dns_records: check.records,
      p_error: null,
    });
    log(status === "active" ? "domain.active" : "domain.pending_dns", { domain_id: domainId });
    return data;
  } catch (err) {
    const message = err instanceof VercelError ? VERCEL_ERRORS[err.code].message : "Falha ao verificar.";
    const { data } = await admin.rpc("pavox_update_domain_status", {
      p_domain_id: domainId,
      p_status: "error",
      p_dns_records: null,
      p_error: message,
    });
    log("domain.check_failed", { domain_id: domainId, detail: err instanceof Error ? err.message : String(err) });
    return data;
  }
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
  const action = body["action"];

  if (action === "add") {
    const hostname = normalizeHostname(str(body["hostname"], 300));
    if (!hostname) {
      return error("invalid_domain", "Informe um domínio válido, por exemplo checkout.sualoja.com.br.", 422);
    }
    const checkoutId = str(body["checkoutId"], 36);
    if (checkoutId && !UUID_RE.test(checkoutId)) return error("invalid_request", "Checkout inválido.", 400);

    const { data: created, error: addError } = await admin.rpc("pavox_add_domain", {
      p_user_id: userId,
      p_hostname: hostname,
      p_checkout_id: checkoutId || null,
    });
    if (addError) {
      const info = DB_ERRORS[addError.message];
      return info
        ? error(addError.message, info.message, info.status)
        : error("internal_error", "Não foi possível salvar o domínio.", 500);
    }
    const domainId = (created as { id: string }).id;

    try {
      await addDomain(hostname);
    } catch (err) {
      // Nothing was attached on Vercel: roll back the row so the merchant can retry.
      await admin.rpc("pavox_remove_domain", { p_user_id: userId, p_domain_id: domainId });
      log("domain.add_failed", { store_id: userId, detail: err instanceof Error ? err.message : String(err) });
      return vercelError(err);
    }
    log("domain.added", { store_id: userId, domain_id: domainId });
    return json({ domain: await refresh(domainId, hostname) });
  }

  const domainId = str(body["domainId"], 36);
  if (!UUID_RE.test(domainId)) return error("invalid_request", "Domínio inválido.", 400);
  const { data: row } = await admin
    .from("domains")
    .select("id, hostname")
    .eq("id", domainId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) return error("domain_not_found", "Domínio não encontrado.", 404);

  if (action === "verify") {
    return json({ domain: await refresh(row.id, row.hostname) });
  }

  if (action === "remove") {
    try {
      await removeDomain(row.hostname);
    } catch (err) {
      return vercelError(err);
    }
    await admin.rpc("pavox_remove_domain", { p_user_id: userId, p_domain_id: row.id });
    log("domain.removed", { store_id: userId, domain_id: row.id });
    return json({ ok: true });
  }

  return error("invalid_request", "Ação inválida.", 400);
});

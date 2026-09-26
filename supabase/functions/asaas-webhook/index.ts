// Asaas notifications.
//
// URL (registered on the merchant's Asaas account when they connect):
//   {SUPABASE_URL}/functions/v1/asaas-webhook?store={id}
//
// Asaas sends the token chosen at connection time in the `asaas-access-token`
// header; it is compared with the one stored in Vault for that store. Even
// then the notification is only a hint: the charge is re-read from the Asaas
// API before anything changes (pavox_apply_payment_status deduplicates).
//
// Asaas pauses a webhook queue after repeated non-2xx answers, so anything
// that is not ours (unknown charge, other events) is acknowledged with 200.
import { admin, json, log } from "../_shared/http.ts";
import { syncOrder } from "../_shared/payments.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sameToken(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);

  const store = new URL(req.url).searchParams.get("store") ?? "";
  if (!UUID_RE.test(store)) {
    log("webhook.invalid", { provider: "asaas", reason: "missing_store" });
    return json({ ok: false }, 400);
  }

  const { data: stored } = await admin.rpc("pavox_get_integration_credentials", {
    p_user_id: store,
    p_provider: "asaas",
  });
  const expected = String((stored as { credentials?: Record<string, string> } | null)?.credentials?.["webhook_token"] ?? "");
  const received = req.headers.get("asaas-access-token") ?? "";
  if (!expected || !sameToken(received, expected)) {
    log("webhook.invalid", { provider: "asaas", reason: "bad_token", store });
    return json({ ok: false }, 401);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const event = String(body["event"] ?? "");
  const payment = (body["payment"] ?? {}) as Record<string, unknown>;
  const paymentId = String(payment["id"] ?? "");
  log("webhook.received", { provider: "asaas", type: event, resource_id: paymentId, store });

  if (!event.startsWith("PAYMENT_") || !paymentId || paymentId.length > 64) {
    return json({ ok: true, ignored: event || "invalid" });
  }

  const { data: order, error } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", store)
    .eq("gateway", "asaas")
    .eq("gateway_payment_id", paymentId)
    .maybeSingle();
  if (error) {
    log("webhook.error", { provider: "asaas", detail: error.message });
    return json({ ok: false }, 500); // Asaas retries.
  }
  if (!order) {
    // Charges created outside PAVOX (or before the order was linked).
    return json({ ok: true, ignored: "unknown_payment" });
  }

  try {
    const result = await syncOrder(order.id, "webhook", {
      event,
      event_id: body["id"] ?? null,
      resource_id: paymentId,
    });
    log("webhook.processed", { provider: "asaas", order_id: order.id, result });
    return json({ ok: true, result });
  } catch (err) {
    log("webhook.error", {
      provider: "asaas",
      order_id: order.id,
      detail: err instanceof Error ? err.message : String(err),
    });
    return json({ ok: false }, 500);
  }
});

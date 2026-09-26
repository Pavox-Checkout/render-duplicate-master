// Payment notifications for gateways without a dedicated function
// (HopySplit brands — Beehive, Axion Pay, Pagou, CredWave —, Appmax, Garu).
//
// URL: {SUPABASE_URL}/functions/v1/gateway-webhook?provider={id}&store={user id}
//
// None of these notifications is trusted: the charge id is only used to find
// the store's own order, and the status is then re-read from the gateway API
// with the merchant's credentials (syncOrder). A forged call can at most make
// PAVOX look the real status up again. Deduplication and state transitions
// happen in pavox_apply_payment_status().
import { admin, json, log } from "../_shared/http.ts";
import { providerSpec } from "../_shared/gateways/registry.ts";
import { syncOrder } from "../_shared/payments.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);

  const url = new URL(req.url);
  const provider = (url.searchParams.get("provider") ?? "").slice(0, 32);
  const store = url.searchParams.get("store") ?? "";
  const extract = providerSpec(provider)?.webhookPaymentId;
  if (!extract || !UUID_RE.test(store)) {
    log("webhook.invalid", { provider, reason: "unknown_provider_or_store" });
    return json({ ok: false }, 400);
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }
  const paymentId = extract(body);
  log("webhook.received", { provider, store, resource_id: paymentId });
  if (!paymentId) return json({ ok: true, ignored: "no_payment_id" });

  const { data: order, error } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", store)
    .eq("gateway", provider)
    .eq("gateway_payment_id", paymentId)
    .maybeSingle();
  if (error) {
    log("webhook.error", { provider, detail: error.message });
    return json({ ok: false }, 500); // the gateway retries
  }
  if (!order) return json({ ok: true, ignored: "unknown_payment" });

  try {
    const result = await syncOrder(order.id, "webhook", { provider, resource_id: paymentId });
    log("webhook.processed", { provider, order_id: order.id, result });
    return json({ ok: true, result });
  } catch (err) {
    log("webhook.error", { provider, order_id: order.id, detail: err instanceof Error ? err.message : String(err) });
    return json({ ok: false }, 500);
  }
});

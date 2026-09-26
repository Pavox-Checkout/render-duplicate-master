// Mercado Pago notifications (topic "Order").
//
// URLs:
//   {SUPABASE_URL}/functions/v1/mercadopago-webhook            — PAVOX application
//     (stores connected with "Conectar com Mercado Pago"/OAuth)
//   {SUPABASE_URL}/functions/v1/mercadopago-webhook?store={id} — a merchant's own
//     application (stores connected by pasting credentials)
//
// Mercado Pago order ids are globally unique, so the order is found by id; the
// optional `store` only narrows the lookup.
//
// The notification is treated as a hint only: the order is re-read from the
// Mercado Pago API with the merchant's own credentials before anything changes.
// Deduplication and state transitions happen in pavox_apply_payment_status().
import { admin, json, log } from "../_shared/http.ts";
import { syncOrder } from "../_shared/payments.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") return json({ ok: false }, 405);

  const url = new URL(req.url);
  const store = url.searchParams.get("store") ?? "";
  let body: Record<string, unknown> = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  const bodyData = (body["data"] ?? {}) as Record<string, unknown>;
  const type = String(body["type"] ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "");
  const resourceId = String(bodyData["id"] ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  log("webhook.received", { provider: "mercadopago", type, resource_id: resourceId, store });

  if ((store && !UUID_RE.test(store)) || !resourceId || resourceId.length > 64) {
    log("webhook.invalid", { provider: "mercadopago", reason: "missing_store_or_id" });
    return json({ ok: true, ignored: "invalid" });
  }
  if (type && type !== "order") {
    // Legacy "payment"/"merchant_order" topics are not used by the Orders integration.
    return json({ ok: true, ignored: type });
  }

  let query = admin
    .from("orders")
    .select("id")
    .eq("gateway", "mercadopago")
    .eq("gateway_payment_id", resourceId);
  if (store) query = query.eq("user_id", store);
  const { data: order, error } = await query.maybeSingle();
  if (error) {
    log("webhook.error", { provider: "mercadopago", detail: error.message });
    return json({ ok: false }, 500); // Mercado Pago retries.
  }
  if (!order) {
    log("webhook.invalid", { provider: "mercadopago", reason: "order_not_found", resource_id: resourceId });
    return json({ ok: true, ignored: "unknown_order" });
  }

  try {
    const result = await syncOrder(order.id, "webhook", {
      type,
      action: body["action"] ?? null,
      resource_id: resourceId,
    });
    log("webhook.processed", { provider: "mercadopago", order_id: order.id, result });
    return json({ ok: true, result });
  } catch (err) {
    log("webhook.error", {
      provider: "mercadopago",
      order_id: order.id,
      detail: err instanceof Error ? err.message : String(err),
    });
    return json({ ok: false }, 500);
  }
});

import { admin, json, log } from "../_shared/http.ts";

const API = () => Deno.env.get("ASAAS_API_URL") || "https://api-sandbox.asaas.com/v3";
const key = () => Deno.env.get("ASAAS_API_KEY") || "";
const token = () => Deno.env.get("ASAAS_PLAN_WEBHOOK_TOKEN") || "";

async function asaas(path: string) {
  const response = await fetch(`${API()}${path}`, {
    headers: { access_token: key(), "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Asaas HTTP ${response.status}`);
  return body as { id?: string; status?: string; deleted?: boolean };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const configured = token();
  if (configured && req.headers.get("x-pavox-webhook-token") !== configured)
    return json({ ok: false }, 401);
  try {
    const body = (await req.json()) as { payment?: { id?: string }; event?: string };
    const paymentId = body.payment?.id || "";
    if (!paymentId) return json({ ok: true, ignored: true });
    const payment = await asaas(`/payments/${encodeURIComponent(paymentId)}`);
    const { data: record } = await admin
      .from("billing_records")
      .select("id,user_id,plan_id,status,amount,gateway_payment_id")
      .eq("gateway", "asaas")
      .eq("gateway_payment_id", paymentId)
      .maybeSingle();
    if (!record) return json({ ok: true, ignored: "unknown_payment" });
    const paid =
      payment.status === "RECEIVED" ||
      payment.status === "CONFIRMED" ||
      payment.status === "RECEIVED_IN_CASH";
    const terminal =
      payment.deleted || payment.status === "OVERDUE" || payment.status === "REFUNDED";
    const next = paid
      ? "pago"
      : terminal
        ? payment.status === "OVERDUE"
          ? "expirado"
          : "cancelado"
        : "pendente";
    if (record.status === "pago" && !paid) return json({ ok: true, ignored: "already_paid" });
    await admin
      .from("billing_records")
      .update({
        status: next,
        paid_at: paid ? new Date().toISOString() : null,
        payment_data: { asaas_status: payment.status, event: body.event || null },
      })
      .eq("id", record.id)
      .eq("status", "pendente");
    if (paid) {
      const { data: current } = await admin
        .from("subscriptions")
        .select("id,plan_id,status")
        .eq("user_id", record.user_id)
        .maybeSingle();
      await admin
        .from("subscriptions")
        .upsert(
          {
            user_id: record.user_id,
            plan_id: record.plan_id,
            pending_plan_id: null,
            status: "active",
            started_at: new Date().toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 31 * 86400000).toISOString(),
          },
          { onConflict: "user_id" },
        );
      log("plan_payment.approved", {
        billing_id: record.id,
        user_id: record.user_id,
        previous_plan: current?.plan_id,
      });
    }
    return json({ ok: true, status: next });
  } catch (e) {
    log("plan_payment.webhook_error", { detail: e instanceof Error ? e.message : String(e) });
    return json({ ok: false }, 500);
  }
});

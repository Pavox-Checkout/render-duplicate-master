// Merchant actions on an order (requires a logged-in merchant who owns it).
//
// POST { action: "refund", orderId }          → full refund at the gateway.
// POST { action: "resend_receipt", orderId }  → e-mails the buyer the receipt again.
import { admin, CORS_HEADERS, error, json, log, str } from "../_shared/http.ts";
import { notifyBuyer, publicOrder, refundOrder } from "../_shared/payments.ts";
import { GatewayError } from "../_shared/gateways/types.ts";
import { providerSpec } from "../_shared/gateways/registry.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function currentUserId(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error: authError } = await admin.auth.getUser(token);
  return authError || !data.user ? null : data.user.id;
}

async function ownedOrder(orderId: string, userId: string) {
  const { data } = await admin
    .from("orders")
    .select("id, status, gateway")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  return data as { id: string; status: string; gateway: string | null } | null;
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
  const orderId = str(body["orderId"], 36);
  if (!UUID_RE.test(orderId)) return error("invalid_request", "Pedido inválido.", 400);

  // Other stores' orders answer exactly like missing ones.
  const order = await ownedOrder(orderId, userId);
  if (!order) return error("not_found", "Pedido não encontrado.", 404);

  const gatewayName = providerSpec(order.gateway ?? "")?.displayName ?? "gateway";

  try {
    if (body["action"] === "refund") {
      if (order.status !== "Aprovado" && order.status !== "Reembolsado") {
        return error("not_refundable", "Só pedidos aprovados podem ser reembolsados.", 409);
      }
      const updated = (await refundOrder(orderId, userId)) as { status?: string } | null;
      const done = updated?.status === "Reembolsado";
      log("order.refund", { order_id: orderId, store_id: userId, result: updated?.status });
      return json({
        order: updated,
        message: done
          ? "Pagamento reembolsado."
          : `Reembolso solicitado ao ${gatewayName}. O status muda assim que ele confirmar.`,
      });
    }

    if (body["action"] === "resend_receipt") {
      if (order.status !== "Aprovado") {
        return error("not_paid", "O recibo só pode ser enviado para pedidos aprovados.", 409);
      }
      const result = await notifyBuyer(orderId, "paid", { force: true });
      if (result === "sent") return json({ message: "Recibo reenviado para o comprador." });
      if (result === "not_configured") {
        return error("email_not_configured", "O envio de e-mails ainda não foi configurado na PAVOX.", 503);
      }
      if (result === "no_email") return error("no_email", "Este pedido não tem e-mail do comprador.", 422);
      return error("email_failed", "Não foi possível enviar o e-mail agora. Tente novamente.", 502);
    }

    return error("invalid_request", "Ação inválida.", 400);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    log("order.action_failed", { order_id: orderId, action: body["action"], detail });
    if (err instanceof GatewayError && err.code === "payment_rejected") {
      return error("refund_rejected", `O ${gatewayName} recusou o reembolso: ${detail}`, 422);
    }
    return json(
      {
        error: "action_failed",
        message: "Não foi possível concluir agora. Tente novamente em instantes.",
        order: await publicOrder(orderId).catch(() => null),
      },
      502,
    );
  }
});

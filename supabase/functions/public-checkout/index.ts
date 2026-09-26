// Public checkout API (no login).
//
// POST { action?: "create", checkoutId, paymentMethod, idempotencyKey, buyer, card? }
//   → creates customer + order (price from the database) and the gateway charge.
//   → 200 { order } — order.payment holds the Pix QR code / boleto line / card result.
//   `card` is the token made in the browser by the gateway SDK — never card data.
// POST { action: "config", checkoutId }
//   → public keys the browser needs to tokenize cards for this checkout.
// POST { action: "status", orderId }
//   → re-reads the charge from the gateway (server-to-server) and returns the order.
//
// verify_jwt = false: buyers are anonymous. Authorization lives in the SQL
// functions (published checkout only, server-side price, order UUID as token).
import { admin, CORS_HEADERS, error, json, log, str } from "../_shared/http.ts";
import { chargeOrder, loadConnection, publicOrder, syncOrder } from "../_shared/payments.ts";
import { GatewayError, type CardData } from "../_shared/gateways/types.ts";

const ORDER_ERRORS: Record<string, { status: number; message: string }> = {
  invalid_request: { status: 400, message: "Requisição inválida." },
  idempotency_conflict: { status: 409, message: "Requisição duplicada com dados diferentes." },
  checkout_not_found: { status: 404, message: "Este checkout não está disponível." },
  product_unavailable: { status: 409, message: "Este produto não está disponível no momento." },
  out_of_stock: { status: 409, message: "Produto esgotado." },
  payment_method_unavailable: { status: 409, message: "Forma de pagamento indisponível para este checkout." },
  invalid_email: { status: 422, message: "Informe um e-mail válido." },
  invalid_name: { status: 422, message: "Informe seu nome completo." },
  invalid_phone: { status: 422, message: "Telefone inválido." },
  invalid_document: { status: 422, message: "CPF/CNPJ inválido." },
  invalid_address: { status: 422, message: "Endereço de entrega incompleto." },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function orderError(code: string) {
  const known = ORDER_ERRORS[code];
  if (!known) return error("internal_error", "Não foi possível concluir. Tente novamente.", 500);
  return error(code, known.message, known.status);
}

function buyerFrom(raw: Record<string, unknown>) {
  const address = raw["address"] && typeof raw["address"] === "object" ? (raw["address"] as Record<string, unknown>) : null;
  return {
    person_type: raw["person_type"] === "pj" ? "pj" : "pf",
    name: str(raw["name"], 200),
    email: str(raw["email"], 254),
    phone: str(raw["phone"], 30),
    document: str(raw["document"], 30),
    ...(address
      ? {
          address: {
            zip: str(address["zip"], 12),
            street: str(address["street"], 200),
            number: str(address["number"], 20),
            complement: str(address["complement"], 100),
            neighborhood: str(address["neighborhood"], 100),
            city: str(address["city"], 100),
            state: str(address["state"], 2),
          },
        }
      : {}),
  };
}

function cardFrom(raw: unknown): CardData | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const token = str(c["token"], 64);
  const paymentMethodId = str(c["paymentMethodId"], 32);
  const installments = Number(c["installments"]);
  if (!/^[A-Za-z0-9]{16,64}$/.test(token) || !/^[a-z_]{2,32}$/.test(paymentMethodId)) return null;
  if (!Number.isInteger(installments) || installments < 1 || installments > 24) return null;
  const ident = c["identification"] && typeof c["identification"] === "object"
    ? (c["identification"] as Record<string, unknown>)
    : null;
  return {
    token,
    paymentMethodId,
    paymentTypeId: c["paymentTypeId"] === "debit_card" ? "debit_card" : "credit_card",
    installments,
    ...(ident && str(ident["number"], 20)
      ? { identification: { type: str(ident["type"], 10) || "CPF", number: str(ident["number"], 20) } }
      : {}),
  };
}

async function handleCreate(body: Record<string, unknown>) {
  const checkoutId = str(body["checkoutId"], 36);
  const idempotencyKey = str(body["idempotencyKey"], 36);
  const paymentMethod = str(body["paymentMethod"], 16);
  const rawBuyer = body["buyer"];
  if (!UUID_RE.test(checkoutId) || !UUID_RE.test(idempotencyKey) || !rawBuyer || typeof rawBuyer !== "object") {
    return orderError("invalid_request");
  }

  const { data: order, error: rpcError } = await admin.rpc("create_public_order", {
    p_checkout_id: checkoutId,
    p_buyer: buyerFrom(rawBuyer as Record<string, unknown>),
    p_payment_method: paymentMethod,
    p_idempotency_key: idempotencyKey,
  });
  if (rpcError) {
    log("order.create_failed", { checkout_id: checkoutId, code: rpcError.message });
    return orderError(rpcError.message);
  }

  const orderId = (order as { id: string }).id;
  log("order.created", { checkout_id: checkoutId, order_id: orderId });

  const card = paymentMethod === "card" ? cardFrom(body["card"]) : null;
  if (paymentMethod === "card" && !card) {
    return json(
      {
        error: "invalid_card",
        message: "Confira os dados do cartão e tente novamente.",
        order: await publicOrder(orderId),
      },
      422,
    );
  }

  try {
    return json({ order: await chargeOrder(orderId, card ? { card } : {}) });
  } catch (err) {
    const code = err instanceof GatewayError ? err.code : "unknown_error";
    log("payment.failed", { order_id: orderId, code, detail: err instanceof Error ? err.message : String(err) });
    const rejectedCard = paymentMethod === "card" && code === "payment_rejected";
    return json(
      {
        error: "payment_failed",
        message: rejectedCard
          ? "O pagamento com cartão não foi aceito. Confira os dados ou use outro cartão."
          : "Não foi possível gerar o pagamento agora. Tente novamente em instantes.",
        order: await publicOrder(orderId),
      },
      rejectedCard ? 402 : 502,
    );
  }
}

async function handleStatus(body: Record<string, unknown>) {
  const orderId = str(body["orderId"], 36);
  if (!UUID_RE.test(orderId)) return orderError("invalid_request");
  const order = (await publicOrder(orderId)) as { status: string } | null;
  if (!order) return error("order_not_found", "Pedido não encontrado.", 404);
  if (order.status === "Pendente") {
    try {
      await syncOrder(orderId, "poll");
    } catch (err) {
      log("payment.sync_failed", { order_id: orderId, detail: err instanceof Error ? err.message : String(err) });
    }
  }
  return json({ order: await publicOrder(orderId) });
}

async function handleConfig(body: Record<string, unknown>) {
  const checkoutId = str(body["checkoutId"], 36);
  if (!UUID_RE.test(checkoutId)) return orderError("invalid_request");
  const { data: checkout } = await admin
    .from("checkouts")
    .select("user_id")
    .eq("id", checkoutId)
    .eq("published", true)
    .maybeSingle();
  if (!checkout) return orderError("checkout_not_found");
  const { data: provider } = await admin.rpc("pavox_gateway_for_method", {
    p_user_id: checkout.user_id,
    p_method: "card",
  });
  if (!provider) return json({ card: null });
  try {
    const { credentials } = await loadConnection(checkout.user_id, String(provider));
    // Public key only: made to be used in the browser to tokenize the card.
    return json({ card: credentials["public_key"] ? { provider, publicKey: credentials["public_key"] } : null });
  } catch {
    return json({ card: null });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return error("method_not_allowed", "Método não permitido.", 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return orderError("invalid_request");
  }

  try {
    if (body["action"] === "status") return await handleStatus(body);
    if (body["action"] === "config") return await handleConfig(body);
    return await handleCreate(body);
  } catch (err) {
    log("checkout.internal_error", { detail: err instanceof Error ? err.message : String(err) });
    return orderError("internal_error");
  }
});

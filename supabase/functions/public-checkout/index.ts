// Public checkout API (no login): the buyer submits the form, the backend
// creates customer + order with the price read from the database.
//
// POST { checkoutId, paymentMethod, idempotencyKey, buyer: { person_type, name,
//        email, phone, document, address? } }
// → 200 { order } | 4xx { error, message }
//
// verify_jwt = false: buyers are anonymous. All authorization happens in
// create_public_order (published checkout only, server-side price).

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ERROR_MESSAGES: Record<string, { status: number; message: string }> = {
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function fail(code: string) {
  const known = ERROR_MESSAGES[code] ?? { status: 500, message: "Não foi possível concluir. Tente novamente." };
  return json({ error: ERROR_MESSAGES[code] ? code : "internal_error", message: known.message }, known.status);
}

function secretKey(): string {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    const parsed = JSON.parse(keys) as Record<string, string>;
    if (parsed["default"]) return parsed["default"];
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_request");
  }

  const checkoutId = str(body["checkoutId"], 36);
  const idempotencyKey = str(body["idempotencyKey"], 36);
  const paymentMethod = str(body["paymentMethod"], 16);
  const rawBuyer = body["buyer"];
  if (!UUID_RE.test(checkoutId) || !UUID_RE.test(idempotencyKey) || !rawBuyer || typeof rawBuyer !== "object") {
    return fail("invalid_request");
  }

  const b = rawBuyer as Record<string, unknown>;
  const rawAddress = b["address"] && typeof b["address"] === "object" ? (b["address"] as Record<string, unknown>) : null;
  const buyer = {
    person_type: b["person_type"] === "pj" ? "pj" : "pf",
    name: str(b["name"], 200),
    email: str(b["email"], 254),
    phone: str(b["phone"], 30),
    document: str(b["document"], 30),
    ...(rawAddress
      ? {
          address: {
            zip: str(rawAddress["zip"], 12),
            street: str(rawAddress["street"], 200),
            number: str(rawAddress["number"], 20),
            complement: str(rawAddress["complement"], 100),
            city: str(rawAddress["city"], 100),
            state: str(rawAddress["state"], 2),
          },
        }
      : {}),
  };

  const { data: order, error } = await admin.rpc("create_public_order", {
    p_checkout_id: checkoutId,
    p_buyer: buyer,
    p_payment_method: paymentMethod,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const code = error.message in ERROR_MESSAGES ? error.message : "internal_error";
    console.error(JSON.stringify({ event: "order.create_failed", checkout_id: checkoutId, code, detail: error.message }));
    return fail(code);
  }

  console.log(JSON.stringify({ event: "order.created", checkout_id: checkoutId, order_id: (order as { id: string }).id }));
  return json({ order });
});

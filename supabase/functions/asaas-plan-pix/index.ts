import { admin, CORS_HEADERS, error, json } from "../_shared/http.ts";

const API = () => Deno.env.get("ASAAS_API_URL") || "https://api-sandbox.asaas.com/v3";
const key = () => Deno.env.get("ASAAS_API_KEY") || "";
const UUID = /^[0-9a-f-]{36}$/i;

async function userId(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error: authError } = await admin.auth.getUser(token);
  return authError || !data.user ? null : data.user.id;
}

async function asa(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API()}${path}`, {
    ...init,
    headers: { access_token: key(), "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body?.errors?.[0]?.description || `Asaas HTTP ${response.status}`);
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return error("method_not_allowed", "Método não permitido.", 405);
  const uid = await userId(req);
  if (!uid) return error("unauthorized", "Sessão expirada.", 401);
  if (!key()) return error("configuration", "Asaas Sandbox não configurado.", 503);

  try {
    const body = (await req.json()) as { planSlug?: string };
    const slug = body.planSlug === "growth" || body.planSlug === "pro" ? body.planSlug : "";
    if (!slug) return error("invalid_plan", "Plano inválido.", 400);
    const [{ data: profile }, { data: plan }, { data: existing }] = await Promise.all([
      admin
        .from("profiles")
        .select("full_name,company_name,email,cpf_cnpj,document")
        .eq("id", uid)
        .maybeSingle(),
      admin
        .from("plans")
        .select("id,name,slug,monthly_price")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle(),
      admin
        .from("billing_records")
        .select("id,status,amount,payment_data,gateway_payment_id")
        .eq("user_id", uid)
        .eq(
          "plan_id",
          (await admin.from("plans").select("id").eq("slug", slug).maybeSingle()).data?.id || "",
        )
        .eq("type", "mensalidade")
        .in("status", ["aberto", "pendente"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (!profile || !plan) return error("not_found", "Usuário ou plano não encontrado.", 404);
    if (existing?.gateway_payment_id && existing.payment_data?.pix?.payload)
      return json({ payment: existing.payment_data, billingId: existing.id });
    const doc = String(profile.cpf_cnpj || profile.document || "").replace(/\D/g, "");
    if (![11, 14].includes(doc.length))
      return error("document_required", "Cadastre seu CPF ou CNPJ antes de pagar.", 422);
    const customer = await asa("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: profile.full_name || profile.company_name || "Cliente PAVOX",
        email: profile.email,
        cpfCnpj: doc,
        notificationDisabled: true,
      }),
    });
    const payment = await asa("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customer.id,
        billingType: "PIX",
        value: Number(plan.monthly_price),
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        description: `PAVOX ${plan.name} - mensalidade`,
        externalReference: `${uid}:${plan.slug}`,
      }),
    });
    const pix = await asa(`/payments/${payment.id}/pixQrCode`);
    const data = {
      id: payment.id,
      plan: { slug: plan.slug, name: plan.name, amount: plan.monthly_price },
      pix: {
        encodedImage: pix.encodedImage,
        payload: pix.payload,
        expirationDate: pix.expirationDate,
      },
      status: "pending",
    };
    const { data: record, error: insertError } = await admin
      .from("billing_records")
      .insert({
        user_id: uid,
        plan_id: plan.id,
        type: "mensalidade",
        description: `Plano ${plan.name}`,
        reference_period: new Date().toISOString().slice(0, 7),
        amount: plan.monthly_price,
        status: "pendente",
        due_date: payment.dueDate,
        gateway: "asaas",
        gateway_payment_id: payment.id,
        payment_data: data,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;
    return json({ payment: data, billingId: record.id });
  } catch (e) {
    return error(
      "payment_creation_failed",
      e instanceof Error ? e.message : "Não foi possível criar o PIX.",
      502,
    );
  }
});

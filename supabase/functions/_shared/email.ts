// Transactional e-mails to buyers, sent through the Brevo API.
//
// Secrets (Edge Functions): BREVO_API_KEY and EMAIL_FROM (a sender verified in
// Brevo). EMAIL_FROM_NAME is optional. Without them, e-mails are skipped and
// logged — never faked.

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 10_000;

export type EmailConfig = { apiKey: string; fromEmail: string; fromName: string };

export function emailConfig(): EmailConfig | null {
  const apiKey = Deno.env.get("BREVO_API_KEY") ?? "";
  const fromEmail = Deno.env.get("EMAIL_FROM") ?? "";
  if (!apiKey || !fromEmail) return null;
  return { apiKey, fromEmail, fromName: Deno.env.get("EMAIL_FROM_NAME") || "PAVOX" };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const METHOD_LABELS: Record<string, string> = { pix: "Pix", card: "Cartão de crédito", boleto: "Boleto" };

export type OrderEmailData = {
  kind: "paid" | "refunded";
  storeName: string;
  buyerName: string;
  buyerEmail: string;
  reference: string;
  productName: string;
  amount: number;
  method: string;
  installments?: number;
};

export function orderEmail(d: OrderEmailData): { subject: string; html: string; text: string } {
  const store = d.storeName || "a loja";
  const first = (d.buyerName.trim().split(/\s+/)[0] ?? "").slice(0, 60);
  const method =
    (METHOD_LABELS[d.method] ?? d.method) + (d.method === "card" && d.installments && d.installments > 1 ? ` em ${d.installments}x` : "");
  const paid = d.kind === "paid";
  const subject = paid ? `Pagamento confirmado — pedido ${d.reference}` : `Pagamento reembolsado — pedido ${d.reference}`;
  const intro = paid
    ? `Recebemos o seu pagamento. Obrigado pela compra em ${store}!`
    : `O pagamento do seu pedido em ${store} foi reembolsado. O valor volta pelo mesmo meio de pagamento; o prazo depende do seu banco ou cartão.`;

  const rows: Array<[string, string]> = [
    ["Pedido", d.reference],
    ["Produto", d.productName],
    ["Valor", brl(d.amount)],
    ["Pagamento", method],
  ];

  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#f5f5f7;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:12px;padding:28px">
<tr><td>
<p style="margin:0 0 4px;font-size:13px;color:#666">${escapeHtml(store)}</p>
<h1 style="margin:0 0 16px;font-size:20px">${paid ? "Pagamento confirmado" : "Pagamento reembolsado"}</h1>
<p style="margin:0 0 18px;font-size:14px;line-height:1.5">${first ? `Olá, ${escapeHtml(first)}! ` : ""}${escapeHtml(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #eee">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:10px 0;color:#666;border-bottom:1px solid #eee">${escapeHtml(k)}</td><td align="right" style="padding:10px 0;font-weight:bold;border-bottom:1px solid #eee">${escapeHtml(v)}</td></tr>`,
  )
  .join("\n")}
</table>
<p style="margin:18px 0 0;font-size:12px;color:#888">Guarde este e-mail como comprovante. Dúvidas sobre o pedido? Responda a este e-mail ou fale com ${escapeHtml(store)}.</p>
</td></tr></table>
<p style="font-size:11px;color:#aaa;margin:14px 0 0">Enviado pela PAVOX em nome de ${escapeHtml(store)}.</p>
</td></tr></table>
</body></html>`;

  const text = [
    paid ? "Pagamento confirmado" : "Pagamento reembolsado",
    "",
    `${first ? `Olá, ${first}! ` : ""}${intro}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
  ].join("\n");

  return { subject, html, text };
}

export class EmailError extends Error {}

export async function sendEmail(
  config: EmailConfig,
  msg: { to: string; toName?: string; subject: string; html: string; text: string; senderName?: string },
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(BREVO_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "api-key": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        // Store name as the visible sender; the address is PAVOX's verified sender.
        sender: { email: config.fromEmail, name: (msg.senderName || config.fromName).slice(0, 70) },
        to: [{ email: msg.to, ...(msg.toName ? { name: msg.toName.slice(0, 70) } : {}) }],
        subject: msg.subject,
        htmlContent: msg.html,
        textContent: msg.text,
      }),
    });
  } catch {
    throw new EmailError("Brevo não respondeu.");
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string; code?: string };
  if (!res.ok) throw new EmailError(`${data.code ?? res.status}: ${data.message ?? "falha ao enviar"}`);
  return data.messageId ?? "";
}

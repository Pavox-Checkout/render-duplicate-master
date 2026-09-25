/**
 * Configuração central do widget de suporte PAVOX.
 * Não duplicar o número de WhatsApp em outros componentes — sempre importar deste arquivo.
 */
export const PAVOX_SUPPORT_WHATSAPP_NUMBER = "5522999267900";

export const PAVOX_SUPPORT_REASONS = [
  "Problema técnico",
  "Checkout",
  "Pagamentos",
  "Vendas e pedidos",
  "Planos e assinatura",
  "Dúvidas sobre a PAVOX",
  "Outro assunto",
] as const;

export type PavoxSupportReason = (typeof PAVOX_SUPPORT_REASONS)[number];

export function buildPavoxSupportWhatsAppLink(params: {
  reason: PavoxSupportReason;
  email: string;
  message: string;
}): string {
  const { reason, email, message } = params;

  const text = [
    "Olá, equipe PAVOX!",
    "",
    "Preciso de atendimento.",
    "",
    `Assunto: ${reason}`,
    `E-mail da conta: ${email.trim() || "Não informado"}`,
    `Mensagem: ${message.trim() || "Não informado"}`,
  ].join("\n");

  return `https://wa.me/${PAVOX_SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

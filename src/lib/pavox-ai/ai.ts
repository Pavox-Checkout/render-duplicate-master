import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";

const MODEL = "openai/gpt-4.1-mini";

const SYSTEM_BASE = `Você é a Pavox AI, a inteligência de negócios da plataforma PAVOX Checkout.
Você ajuda lojistas brasileiros a vender mais analisando os dados reais da operação deles.

Regras:
- Responda SEMPRE em português do Brasil, de forma direta, prática e acionável.
- Baseie-se apenas nos dados fornecidos no contexto. Se um dado não estiver no contexto, diga que ainda não há dados suficientes em vez de inventar números.
- Seja específico: cite números do contexto quando fizer sentido.
- Priorize recomendações que aumentam conversão, ticket médio e recuperação de vendas.
- Use no máximo 6 frases ou uma lista curta. Nada de encher linguiça.
- Não prometa funcionalidades que não existem; foque no que o lojista pode fazer hoje.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

type AskInput = {
  messages: ChatMessage[];
  context: string;
};

/** Chat da Pavox AI com contexto real da conta. */
export const askPavoxAi = createServerFn({ method: "POST" })
  .validator((data: AskInput) => data)
  .handler(async ({ data }) => {
    const { messages, context } = data;
    const trimmed = messages.slice(-10);

    const { text } = await generateText({
      model: MODEL,
      system: `${SYSTEM_BASE}\n\nContexto da operação (dados reais da conta):\n${context}`,
      messages: trimmed,
      temperature: 0.4,
    });

    return { text: text.trim() };
  });

type GenerateInput = {
  kind: "descricao" | "checkout" | "recuperacao" | "email";
  topic: string;
  context: string;
};

const KIND_PROMPT: Record<GenerateInput["kind"], string> = {
  descricao:
    "Escreva uma descrição de produto persuasiva e escaneável (2 a 4 parágrafos curtos), destacando benefícios e gatilhos de conversão.",
  checkout:
    "Escreva 3 variações de título + subtítulo para a página de checkout, focadas em reduzir objeções e aumentar conversão.",
  recuperacao:
    "Escreva 1 mensagem curta de WhatsApp e 1 de e-mail (assunto + corpo) para recuperar um carrinho abandonado, com tom amigável e senso de urgência sutil.",
  email:
    "Escreva um e-mail de marketing curto (assunto + corpo) para reengajar clientes e impulsionar vendas.",
};

/** Geração de conteúdo de marketing a partir do contexto real da loja. */
export const generatePavoxContent = createServerFn({ method: "POST" })
  .validator((data: GenerateInput) => data)
  .handler(async ({ data }) => {
    const { kind, topic, context } = data;

    const { text } = await generateText({
      model: MODEL,
      system: `${SYSTEM_BASE}\n\nContexto da operação (dados reais da conta):\n${context}`,
      prompt: `${KIND_PROMPT[kind]}\n\nTema/produto informado pelo lojista: "${topic || "não informado — use o contexto da loja"}".\nResponda apenas com o conteúdo final, pronto para copiar e colar.`,
      temperature: 0.7,
    });

    return { text: text.trim() };
  });

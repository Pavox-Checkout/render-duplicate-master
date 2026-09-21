/**
 * Modelo de dados do Checkout Builder (mockado nesta etapa).
 * Toda a estrutura já está no formato que um backend futuro poderia persistir.
 */

export type BlockType =
  | "header"
  | "product"
  | "offer"
  | "customer"
  | "address"
  | "payment"
  | "summary"
  | "footer"
  | "bump"
  | "upsell"
  | "coupon"
  | "countdown"
  | "social"
  | "guarantee"
  | "security";

export type FieldKey =
  | "name"
  | "email"
  | "phone"
  | "doc"
  | "zip"
  | "street"
  | "number"
  | "complement"
  | "city"
  | "state";

export type BlockData = {
  // header
  logo?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  // produto
  title?: string;
  description?: string;
  price?: number;
  compareAt?: number;
  showCompare?: boolean;
  showDiscount?: boolean;
  image?: string;
  showQuantity?: boolean;
  // formulários
  fields?: FieldKey[];
  required?: FieldKey[];
  // pagamento
  pix?: boolean;
  card?: boolean;
  boleto?: boolean;
  // botão / resumo
  buttonLabel?: string;
  buttonHeight?: number;
  buttonFull?: boolean;
  // bump / upsell
  enabled?: boolean;
  // prova social
  rating?: number;
  author?: string;
  // rodapé / textos
  text?: string;
};

export type Block = {
  id: string;
  type: BlockType;
  data: BlockData;
};

export type Appearance = {
  preset: "padrao" | "minimal" | "premium";
  primary: string;
  button: string;
  background: string;
  font: "sans" | "display" | "serif";
  radius: number;
  width: number;
};

export type BuilderState = {
  name: string;
  status: "Rascunho" | "Publicado";
  blocks: Block[];
  appearance: Appearance;
};

export const FIELD_LABELS: Record<FieldKey, string> = {
  name: "Nome completo",
  email: "E-mail",
  phone: "Telefone",
  doc: "CPF",
  zip: "CEP",
  street: "Rua",
  number: "Número",
  complement: "Complemento",
  city: "Cidade",
  state: "Estado",
};

export const CUSTOMER_FIELDS: FieldKey[] = ["name", "email", "phone", "doc"];
export const ADDRESS_FIELDS: FieldKey[] = ["zip", "street", "number", "complement", "city", "state"];

export const BLOCK_LABELS: Record<BlockType, string> = {
  header: "Cabeçalho",
  product: "Produto",
  offer: "Oferta",
  customer: "Cliente",
  address: "Endereço",
  payment: "Pagamento",
  summary: "Resumo",
  footer: "Rodapé",
  bump: "Order Bump",
  upsell: "Upsell",
  coupon: "Cupom",
  countdown: "Contagem regressiva",
  social: "Prova social",
  guarantee: "Garantia",
  security: "Selos de segurança",
};

/** Blocos que não fazem sentido duplicar na página. */
export const SINGLETON_BLOCKS: BlockType[] = [
  "header",
  "product",
  "customer",
  "address",
  "payment",
  "summary",
  "footer",
];

export const PRESETS: Record<Appearance["preset"], Omit<Appearance, "preset">> = {
  padrao: {
    primary: "#2563eb",
    button: "#2563eb",
    background: "#f6f7f9",
    font: "sans",
    radius: 12,
    width: 520,
  },
  minimal: {
    primary: "#0f172a",
    button: "#0f172a",
    background: "#ffffff",
    font: "sans",
    radius: 6,
    width: 480,
  },
  premium: {
    primary: "#1d4ed8",
    button: "#111827",
    background: "#0f172a",
    font: "display",
    radius: 18,
    width: 560,
  },
};

export const FONT_STACKS: Record<Appearance["font"], string> = {
  sans: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  display: '"Sora", ui-sans-serif, system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
};

let seq = 0;
export function newId(type: BlockType) {
  seq += 1;
  return `${type}-${Date.now().toString(36)}-${seq}`;
}

export function createBlock(type: BlockType): Block {
  return { id: newId(type), type, data: defaultData(type) };
}

export function defaultData(type: BlockType): BlockData {
  switch (type) {
    case "header":
      return { logo: "Loja Demo", align: "center", size: "md" };
    case "product":
      return {
        title: "Kit Premium",
        description: "Acesso completo + bônus exclusivos e suporte por 12 meses.",
        price: 197,
        compareAt: 297,
        showCompare: true,
        showDiscount: true,
        showQuantity: true,
      };
    case "offer":
      return { title: "Oferta por tempo limitado", description: "Condição especial desta página." };
    case "customer":
      return { fields: [...CUSTOMER_FIELDS], required: ["name", "email"] };
    case "address":
      return {
        fields: ["zip", "street", "number", "city", "state"],
        required: ["zip", "street", "number"],
      };
    case "payment":
      return { pix: true, card: true, boleto: false };
    case "summary":
      return { buttonLabel: "Finalizar compra", buttonHeight: 48, buttonFull: true, align: "center" };
    case "footer":
      return { text: "© 2026 Loja Demo · Todos os direitos reservados" };
    case "bump":
      return {
        enabled: true,
        title: "Adicionar proteção premium",
        description: "Proteja seu pedido por apenas R$ 19,90",
        price: 19.9,
      };
    case "upsell":
      return { enabled: true, title: "Oferta pós-compra", description: "Mostrada após o pagamento aprovado." };
    case "coupon":
      return { title: "Tem um cupom de desconto?" };
    case "countdown":
      return { title: "Esta oferta expira em", text: "09:58" };
    case "social":
      return {
        text: "Produto excelente, chegou muito rápido!",
        author: "Cliente verificado",
        rating: 5,
      };
    case "guarantee":
      return {
        title: "Compra protegida",
        description: "Seus dados estão protegidos e sua compra é processada com segurança.",
      };
    case "security":
      return { text: "Compra segura · Pagamento protegido · Dados criptografados" };
  }
}

export const INITIAL_STATE: BuilderState = {
  name: "Checkout Principal",
  status: "Rascunho",
  blocks: [
    createBlock("header"),
    createBlock("product"),
    createBlock("customer"),
    createBlock("address"),
    createBlock("payment"),
    createBlock("bump"),
    createBlock("summary"),
    createBlock("guarantee"),
    createBlock("footer"),
  ],
  appearance: { preset: "padrao", ...PRESETS.padrao },
};

export const RECOMMENDATIONS = [
  {
    title: "Seu formulário possui muitos campos",
    detail: "Reduzir campos pode diminuir o abandono em até 12% no mobile.",
  },
  {
    title: "Order bump sem imagem",
    detail: "Ofertas com imagem convertem cerca de 1,8x mais que apenas texto.",
  },
  {
    title: "Ative o Pix como padrão",
    detail: "72% das suas vendas aprovadas vêm de Pix — deixe-o como primeira opção.",
  },
];

/**
 * Modelo de dados do Checkout Builder (mockado nesta etapa).
 * Toda a estrutura já está no formato que um backend futuro poderia persistir.
 * Esta camada é 100% visual/UI — o DEV conectará os dados reais depois.
 */

export type BlockType =
  | "header"
  | "divider"
  | "product"
  | "offer"
  | "customer"
  | "address"
  | "steps"
  | "payment"
  | "summary"
  | "footer"
  | "bump"
  | "upsell"
  | "coupon"
  | "countdown"
  | "social"
  | "live"
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

export type Align = "left" | "center" | "right";

export type CheckoutStep = { id: string; label: string };

export type Testimonial = {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar?: string;
};

export type StepsStyle = "minimal" | "progress" | "numbered";
export type SocialStyle = "simple" | "card" | "stacked" | "rating";
export type SecurityStyle = "inline" | "badges";
export type LivePosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";

export type BlockData = {
  // ── header ──
  identity?: "text" | "logo";
  brandName?: string;
  logo?: string; // compat: nome antigo do texto da marca
  logoUrl?: string;
  logoWidth?: number;
  fontWeight?: number;
  align?: Align;
  size?: "sm" | "md" | "lg";
  secureEnabled?: boolean;
  secureText?: string;
  secureAlign?: Align;
  secureSize?: "sm" | "md";
  secureColor?: string;

  // ── divisor ──
  thickness?: number;
  color?: string;
  opacity?: number;
  spacingTop?: number;
  spacingBottom?: number;

  // ── produto ──
  title?: string;
  description?: string;
  price?: number;
  compareAt?: number;
  showCompare?: boolean;
  showDiscount?: boolean;
  image?: string;
  showQuantity?: boolean;

  // ── formulários ──
  fields?: FieldKey[];
  required?: FieldKey[];

  // ── etapas ──
  stepsEnabled?: boolean;
  stepsStyle?: StepsStyle;
  steps?: CheckoutStep[];
  showNumbers?: boolean;
  showStepIcons?: boolean;

  // ── pagamento ──
  pix?: boolean;
  card?: boolean;
  boleto?: boolean;

  // ── botão / resumo ──
  buttonLabel?: string;
  buttonHeight?: number;
  buttonFull?: boolean;
  buttonRadius?: number;
  buttonColor?: string;
  buttonIcon?: boolean;

  // ── bump / upsell / genéricos ──
  enabled?: boolean;

  // ── prova social ──
  socialStyle?: SocialStyle;
  testimonials?: Testimonial[];
  rating?: number; // compat
  author?: string; // compat

  // ── compra ao vivo ──
  liveName?: string;
  liveProduct?: string;
  livePhrase?: string;
  liveLocation?: string;
  liveShowLocation?: boolean;
  liveShowProduct?: boolean;
  liveShowAvatar?: boolean;
  livePosition?: LivePosition;
  liveDuration?: number;
  liveInterval?: number;

  // ── selos de segurança ──
  securityStyle?: SecurityStyle;
  securityColor?: string;
  securityAlign?: Align;
  securitySize?: "sm" | "md";

  // ── textos genéricos ──
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
  divider: "Divisor",
  product: "Produto",
  offer: "Oferta",
  customer: "Cliente",
  address: "Endereço",
  steps: "Etapas",
  payment: "Pagamento",
  summary: "Resumo",
  footer: "Rodapé",
  bump: "Order Bump",
  upsell: "Upsell",
  coupon: "Cupom",
  countdown: "Contagem regressiva",
  social: "Prova social",
  live: "Compra ao vivo",
  guarantee: "Garantia",
  security: "Selos de segurança",
};

export const BLOCK_HINTS: Partial<Record<BlockType, string>> = {
  header: "Identidade da loja, selo de segurança e alinhamento.",
  divider: "Linha fina para separar o cabeçalho do conteúdo.",
  steps: "Divida o checkout em etapas para reduzir a fricção.",
  payment: "Escolha os métodos exibidos ao cliente.",
  social: "Depoimentos e avaliações reforçam a confiança.",
  live: "Notificações de compras recentes (dados reais depois).",
  security: "Reforce a segurança sem poluir a página.",
};

/** Blocos que não fazem sentido duplicar na página. */
export const SINGLETON_BLOCKS: BlockType[] = [
  "header",
  "product",
  "customer",
  "address",
  "steps",
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

export const LIVE_PHRASES = [
  "acabou de comprar",
  "acabou de adquirir",
  "acabou de garantir o seu",
  "fez um pedido agora",
];

let seq = 0;
export function newId(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export function createBlock(type: BlockType): Block {
  return { id: newId(type), type, data: defaultData(type) };
}

export function defaultData(type: BlockType): BlockData {
  switch (type) {
    case "header":
      return {
        identity: "text",
        brandName: "Loja Demo",
        logoWidth: 120,
        fontWeight: 700,
        align: "center",
        size: "md",
        secureEnabled: true,
        secureText: "Pagamento 100% seguro",
        secureAlign: "center",
        secureSize: "sm",
        secureColor: "#16a34a",
      };
    case "divider":
      return { thickness: 1, color: "#0f172a", opacity: 10, spacingTop: 12, spacingBottom: 12 };
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
    case "steps":
      return {
        stepsEnabled: true,
        stepsStyle: "progress",
        showNumbers: true,
        showStepIcons: false,
        steps: [
          { id: newId("step"), label: "Dados" },
          { id: newId("step"), label: "Endereço e frete" },
          { id: newId("step"), label: "Pagamento" },
        ],
      };
    case "payment":
      return { pix: true, card: true, boleto: false };
    case "summary":
      return {
        buttonLabel: "Finalizar compra",
        buttonHeight: 52,
        buttonFull: true,
        buttonRadius: 12,
        buttonIcon: true,
        align: "center",
      };
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
        socialStyle: "card",
        testimonials: [
          {
            id: newId("tst"),
            name: "Mariana Alves",
            text: "Produto excelente, chegou muito rápido e o checkout foi simples!",
            rating: 5,
          },
        ],
      };
    case "live":
      return {
        liveName: "Maria",
        liveProduct: "Kit Premium",
        livePhrase: "acabou de comprar",
        liveLocation: "São Paulo, SP",
        liveShowLocation: true,
        liveShowProduct: true,
        liveShowAvatar: true,
        livePosition: "bottom-left",
        liveDuration: 5,
        liveInterval: 8,
      };
    case "guarantee":
      return {
        title: "Compra protegida",
        description: "Seus dados estão protegidos e sua compra é processada com segurança.",
      };
    case "security":
      return {
        securityStyle: "badges",
        text: "Compra protegida · Pagamento seguro · Dados protegidos",
        securityColor: "#16a34a",
        securityAlign: "center",
        securitySize: "sm",
      };
  }
}

export const INITIAL_STATE: BuilderState = {
  name: "Checkout Principal",
  status: "Rascunho",
  blocks: [
    createBlock("header"),
    createBlock("divider"),
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

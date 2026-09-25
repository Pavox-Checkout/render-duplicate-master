/**
 * Modelo de dados do Checkout Builder (camada 100% visual/UI).
 *
 * A estrutura é um único objeto de configuração dividido em seções — o mesmo
 * formato que um backend futuro poderia persistir. Nada aqui toca em pagamentos,
 * gateways ou regras de negócio: o DEV conectará os dados reais depois.
 */

export type Align = "left" | "center" | "right";
export type Device = "desktop" | "tablet" | "mobile";
export type Size = "sm" | "md" | "lg";

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

export type PresetKey = "conversao" | "minimalista" | "premium" | "dark";
export type PaletteKey = "pavox" | "azul" | "verde" | "roxo" | "escuro" | "custom";

export type ImageFit = "cover" | "contain" | "original";
export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";
export type StepsStyle = "line" | "numbered" | "compact";
export type SocialLayout = "card" | "list" | "rating";
export type SecurityStyle = "inline" | "badges";
export type LivePosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";
export type SummaryBehavior = "open" | "closed" | "mobile-toggle";

/**
 * Pontos de ancoragem centralizados usados pelos blocos posicionáveis
 * (Cupom e Resumo, por ora). Não é drag-and-drop: o lojista escolhe uma
 * posição em uma lista, e o mesmo `CheckoutConfig` decide onde o bloco
 * aparece tanto no Preview quanto no checkout publicado — a mesma função
 * (`resolveSteps`-like) nunca gera posições impossíveis, pois só usa
 * âncoras que sempre existem (Identificação e Pagamento são etapas
 * canônicas presentes em todo checkout, físico ou digital).
 */
export type BlockPosition =
  | "top"
  | "before-product"
  | "after-product"
  | "before-identification"
  | "after-identification"
  | "before-payment"
  | "after-payment"
  | "after-summary"
  | "before-footer"
  | "end";

export type NoticeMessage = { id: string; text: string };

/**
 * Tipo do produto associado ao checkout. Por enquanto é apenas um valor de
 * demonstração controlado no Preview do Builder — o DEV fornecerá o tipo real
 * do produto depois, e as etapas se ajustarão automaticamente.
 */
export type ProductKind = "physical" | "digital";

/** Etapas canônicas do checkout (estrutura fixa). */
export type StepKey = "identificacao" | "entrega" | "pagamento";
export type StepItem = { key: StepKey; label: string; icon: string; physicalOnly: boolean };
export type Testimonial = { id: string; name: string; text: string; rating: number; avatar?: string | undefined };
export type SecurityItem = { id: string; label: string; icon: string; enabled: boolean };

export type HeaderConfig = {
  logoUrl?: string | undefined;
  logoWidthDesktop: number;
  logoWidthMobile: number;
  logoAlign: Align;
  showStoreName: boolean;
  storeName: string;
  faviconUrl?: string | undefined;
  background: string;
  textColor: string;
  secureEnabled: boolean;
  secureText: string;
  secureAlign: Align;
  secureSize: Exclude<Size, "lg">;
  secureColor: string;
};

export type DividerConfig = {
  enabled: boolean;
  color: string;
  thickness: number;
  opacity: number;
  spacingTop: number;
  spacingBottom: number;
};

export type NoticeConfig = {
  enabled: boolean;
  messages: NoticeMessage[];
  background: string;
  textColor: string;
  size: Size;
  align: Align;
  icon: boolean;
};

export type BannerConfig = {
  enabled: boolean;
  desktopUrl?: string | undefined;
  mobileUrl?: string | undefined;
  height: number;
  fit: ImageFit;
  position: ImagePosition;
  radius: number;
  spacing: number;
};

export type SummaryConfig = {
  enabled: boolean;
  behavior: SummaryBehavior;
  /** Onde o card de resumo aparece no fluxo do checkout. */
  position: BlockPosition;
  installmentsEnabled: boolean;
};

/** Bloco de cupom, independente do Resumo — pode ficar em qualquer âncora. */
export type CouponConfig = {
  enabled: boolean;
  position: BlockPosition;
};

export type StepsConfig = {
  enabled: boolean;
  style: StepsStyle;
  showNumbers: boolean;
  showProgress: boolean;
  /** Rótulos personalizáveis das etapas canônicas. */
  labels: Record<StepKey, string>;
};

export type ScarcityConfig = {
  enabled: boolean;
  text: string;
  duration: number;
  color: string;
  style: "bar" | "badge";
  position: "top" | "above-button";
};

export type SocialConfig = {
  enabled: boolean;
  layout: SocialLayout;
  showStars: boolean;
  showPhoto: boolean;
  testimonials: Testimonial[];
};

export type LiveConfig = {
  enabled: boolean;
  name: string;
  product: string;
  location: string;
  showLocation: boolean;
  phrase: string;
  customPhrase: string;
  showAvatar: boolean;
  /** Exibe como notificação flutuante (overlay) sobre o checkout. Quando
   *  desativado, aparece embutida no fluxo, logo abaixo do cabeçalho. */
  floating: boolean;
  position: LivePosition;
  duration: number;
  interval: number;
  animation: "slide" | "fade";
};

export type PaymentConfig = {
  pix: boolean;
  card: boolean;
  boleto: boolean;
};

export type ColorsConfig = {
  palette: PaletteKey;
  primary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  button: string;
};

export type TypographyConfig = {
  fontFamily: "sans" | "display" | "serif";
  headingSize: number;
  headingWeight: number;
  bodySize: number;
  labelSize: number;
  buttonSize: number;
  buttonWeight: number;
  lineHeight: number;
};

export type FooterConfig = {
  enabled: boolean;
  text: string;
  showLinks: boolean;
  privacyLabel: string;
  termsLabel: string;
  align: Align;
  color: string;
};

export type SecurityConfig = {
  enabled: boolean;
  style: SecurityStyle;
  color: string;
  align: Align;
  size: Exclude<Size, "lg">;
  items: SecurityItem[];
};

export type ProductConfig = {
  /** Determina automaticamente quais etapas aparecem (ex.: Entrega só existe em físico). */
  kind: ProductKind;
  title: string;
  description: string;
  price: number;
  compareAt: number;
  showCompare: boolean;
  showDiscount: boolean;
  showQuantity: boolean;
  image?: string | undefined;
};

/**
 * Controla os dados de identificação solicitados no checkout.
 * `allowCNPJ` habilita a alternância entre Pessoa física e Pessoa jurídica —
 * quando desativado, o checkout nunca mostra a opção de PJ.
 */
export type IdentificationConfig = {
  allowCNPJ: boolean;
};

export type ButtonConfig = {
  label: string;
  height: number;
  full: boolean;
  radius: number;
  icon: boolean;
};

export type LayoutConfig = {
  radius: number;
  width: number;
};

export type FieldsConfig = {
  customer: FieldKey[];
  address: FieldKey[];
  required: FieldKey[];
};

export type CheckoutConfig = {
  mode: "quick" | "advanced";
  preset: PresetKey;
  header: HeaderConfig;
  divider: DividerConfig;
  notice: NoticeConfig;
  banner: BannerConfig;
  summary: SummaryConfig;
  coupon: CouponConfig;
  steps: StepsConfig;
  scarcity: ScarcityConfig;
  social: SocialConfig;
  live: LiveConfig;
  payment: PaymentConfig;
  colors: ColorsConfig;
  typography: TypographyConfig;
  footer: FooterConfig;
  security: SecurityConfig;
  product: ProductConfig;
  identification: IdentificationConfig;
  button: ButtonConfig;
  layout: LayoutConfig;
  fields: FieldsConfig;
};

export type BuilderState = {
  name: string;
  status: "Rascunho" | "Publicado";
  config: CheckoutConfig;
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

/**
 * Estrutura fixa de etapas do checkout. A ordem é sempre a mesma; a etapa de
 * Entrega só é considerada quando o produto é físico. O lojista não cria etapas
 * manualmente — apenas personaliza os rótulos.
 */
export const CANONICAL_STEPS: { key: StepKey; icon: string; label: string; physicalOnly: boolean }[] = [
  { key: "identificacao", icon: "user", label: "Identificação", physicalOnly: false },
  { key: "entrega", icon: "truck", label: "Entrega", physicalOnly: true },
  { key: "pagamento", icon: "card", label: "Pagamento", physicalOnly: false },
];

export const STEP_DESCRIPTIONS: Record<StepKey, string> = {
  identificacao: "Nome, e-mail, CPF e celular do comprador.",
  entrega: "Endereço, CEP e opções de frete. Aparece apenas em produtos físicos.",
  pagamento: "PIX, cartão e boleto. Sempre a etapa final.",
};

/**
 * Retorna as etapas visíveis de acordo com o tipo do produto.
 * Produto físico → Identificação, Entrega, Pagamento.
 * Produto digital → Identificação, Pagamento.
 */
export function resolveSteps(config: CheckoutConfig): StepItem[] {
  return CANONICAL_STEPS.filter((s) => !s.physicalOnly || config.product.kind === "physical").map((s) => ({
    key: s.key,
    icon: s.icon,
    label: config.steps.labels[s.key] || s.label,
    physicalOnly: s.physicalOnly,
  }));
}

export const LIVE_PHRASES = [
  "acabou de comprar",
  "acabou de adquirir",
  "acabou de garantir o seu",
  "fez um pedido agora",
];

export const FONT_STACKS: Record<TypographyConfig["fontFamily"], string> = {
  sans: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  display: '"Sora", ui-sans-serif, system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
};

export const FONT_LABELS: Record<TypographyConfig["fontFamily"], string> = {
  sans: "Manrope (Sans)",
  display: "Sora (Display)",
  serif: "Serifada",
};

let seq = 0;
export function newId(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

/** Paletas rápidas — aplicam apenas cores. */
export const PALETTES: Record<Exclude<PaletteKey, "custom">, { label: string; colors: Omit<ColorsConfig, "palette"> }> = {
  pavox: {
    label: "PAVOX",
    colors: {
      primary: "#2563eb",
      background: "#f6f7f9",
      surface: "#ffffff",
      text: "#0f172a",
      textMuted: "#64748b",
      border: "#e2e8f0",
      success: "#16a34a",
      warning: "#f59e0b",
      error: "#dc2626",
      button: "#2563eb",
    },
  },
  azul: {
    label: "Azul",
    colors: {
      primary: "#0ea5e9",
      background: "#f0f9ff",
      surface: "#ffffff",
      text: "#0c4a6e",
      textMuted: "#64748b",
      border: "#e0f2fe",
      success: "#16a34a",
      warning: "#f59e0b",
      error: "#dc2626",
      button: "#0284c7",
    },
  },
  verde: {
    label: "Verde",
    colors: {
      primary: "#16a34a",
      background: "#f0fdf4",
      surface: "#ffffff",
      text: "#14532d",
      textMuted: "#5f7a6a",
      border: "#dcfce7",
      success: "#15803d",
      warning: "#f59e0b",
      error: "#dc2626",
      button: "#16a34a",
    },
  },
  roxo: {
    label: "Roxo",
    colors: {
      primary: "#7c3aed",
      background: "#faf5ff",
      surface: "#ffffff",
      text: "#3b0764",
      textMuted: "#6b7280",
      border: "#f3e8ff",
      success: "#16a34a",
      warning: "#f59e0b",
      error: "#dc2626",
      button: "#7c3aed",
    },
  },
  escuro: {
    label: "Escuro",
    colors: {
      primary: "#3b82f6",
      background: "#0f172a",
      surface: "#1e293b",
      text: "#f8fafc",
      textMuted: "#94a3b8",
      border: "#334155",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#f87171",
      button: "#3b82f6",
    },
  },
};

export const PALETTE_SWATCHES: { key: PaletteKey; label: string; dots: string[] }[] = [
  { key: "pavox", label: "PAVOX", dots: ["#2563eb", "#0f172a", "#f6f7f9"] },
  { key: "azul", label: "Azul", dots: ["#0284c7", "#0c4a6e", "#f0f9ff"] },
  { key: "verde", label: "Verde", dots: ["#16a34a", "#14532d", "#f0fdf4"] },
  { key: "roxo", label: "Roxo", dots: ["#7c3aed", "#3b0764", "#faf5ff"] },
  { key: "escuro", label: "Escuro", dots: ["#3b82f6", "#f8fafc", "#0f172a"] },
  { key: "custom", label: "Personalizado", dots: ["#2563eb", "#16a34a", "#f59e0b"] },
];

export const PRESETS: { key: PresetKey; label: string; hint: string; accent: string }[] = [
  { key: "conversao", label: "Conversão", hint: "Foco em urgência, prova social e Pix.", accent: "#2563eb" },
  { key: "minimalista", label: "Minimalista", hint: "Limpo, direto e sem distrações.", accent: "#0f172a" },
  { key: "premium", label: "Premium", hint: "Sofisticado, com respiro e tipografia display.", accent: "#1d4ed8" },
  { key: "dark", label: "Dark", hint: "Fundo escuro e alto contraste.", accent: "#3b82f6" },
];

function baseConfig(): CheckoutConfig {
  return {
    mode: "quick",
    preset: "conversao",
    header: {
      logoWidthDesktop: 150,
      logoWidthMobile: 120,
      logoAlign: "center",
      showStoreName: true,
      storeName: "Sua Loja",
      background: "#ffffff",
      textColor: "#0f172a",
      secureEnabled: true,
      secureText: "Pagamento 100% seguro",
      secureAlign: "center",
      secureSize: "sm",
      secureColor: "#16a34a",
    },
    divider: {
      enabled: true,
      color: "#0f172a",
      thickness: 1,
      opacity: 10,
      spacingTop: 12,
      spacingBottom: 12,
    },
    notice: {
      enabled: true,
      messages: [{ id: newId("msg"), text: "Frete grátis para todo o Brasil nas compras de hoje" }],
      background: "#0f172a",
      textColor: "#ffffff",
      size: "sm",
      align: "center",
      icon: true,
    },
    banner: {
      enabled: false,
      height: 160,
      fit: "cover",
      position: "center",
      radius: 12,
      spacing: 12,
    },
    summary: {
      enabled: true,
      behavior: "mobile-toggle",
      position: "before-footer",
      installmentsEnabled: true,
    },
    coupon: {
      enabled: true,
      position: "after-summary",
    },
    steps: {
      enabled: true,
      style: "line",
      showNumbers: true,
      showProgress: true,
      labels: {
        identificacao: "Identificação",
        entrega: "Entrega",
        pagamento: "Pagamento",
      },
    },
    scarcity: {
      enabled: true,
      text: "Esta oferta termina em",
      duration: 10,
      color: "#f59e0b",
      style: "bar",
      position: "top",
    },
    social: {
      enabled: true,
      layout: "card",
      showStars: true,
      showPhoto: true,
      testimonials: [
        {
          id: newId("tst"),
          name: "Mariana A.",
          text: "Compra rápida e checkout simples. Recebi tudo certinho!",
          rating: 5,
        },
        {
          id: newId("tst"),
          name: "Rafael S.",
          text: "Confiei e valeu a pena. Pagamento no Pix caiu na hora.",
          rating: 5,
        },
      ],
    },
    live: {
      enabled: true,
      name: "Maria",
      product: "Kit Premium",
      location: "São Paulo, SP",
      showLocation: true,
      phrase: "acabou de comprar",
      customPhrase: "",
      showAvatar: true,
      floating: true,
      position: "bottom-left",
      duration: 5,
      interval: 8,
      animation: "slide",
    },
    payment: { pix: true, card: true, boleto: false },
    colors: { palette: "pavox", ...PALETTES.pavox.colors },
    typography: {
      fontFamily: "sans",
      headingSize: 19,
      headingWeight: 700,
      bodySize: 13,
      labelSize: 12,
      buttonSize: 15,
      buttonWeight: 600,
      lineHeight: 1.5,
    },
    footer: {
      enabled: true,
      text: "© 2026 Sua Loja · Todos os direitos reservados",
      showLinks: true,
      privacyLabel: "Política de privacidade",
      termsLabel: "Termos de uso",
      align: "center",
      color: "#64748b",
    },
    security: {
      enabled: true,
      style: "badges",
      color: "#16a34a",
      align: "center",
      size: "sm",
      items: [
        { id: newId("sec"), label: "Compra protegida", icon: "shield", enabled: true },
        { id: newId("sec"), label: "Pagamento seguro", icon: "lock", enabled: true },
        { id: newId("sec"), label: "Dados protegidos", icon: "database", enabled: true },
        { id: newId("sec"), label: "Garantia de 7 dias", icon: "badge", enabled: false },
      ],
    },
    product: {
      kind: "digital",
      title: "Kit Premium",
      description: "Acesso completo + bônus exclusivos e suporte por 12 meses.",
      price: 197,
      compareAt: 297,
      showCompare: true,
      showDiscount: true,
      showQuantity: true,
    },
    identification: { allowCNPJ: false },
    button: { label: "Finalizar compra", height: 52, full: true, radius: 12, icon: true },
    layout: { radius: 12, width: 520 },
    fields: {
      customer: [...CUSTOMER_FIELDS],
      address: ["zip", "street", "number", "city", "state"],
      required: ["name", "email", "zip"],
    },
  };
}

/** Overrides aplicados por cada modelo (preset). */
export function applyPreset(config: CheckoutConfig, preset: PresetKey): CheckoutConfig {
  const next: CheckoutConfig = { ...structuredCloneSafe(config), preset };
  switch (preset) {
    case "conversao":
      next.colors = { ...next.colors, palette: "pavox", ...PALETTES.pavox.colors };
      next.typography = { ...next.typography, fontFamily: "sans" };
      next.layout = { ...next.layout, radius: 12 };
      next.scarcity = { ...next.scarcity, enabled: true };
      next.social = { ...next.social, enabled: true, layout: "card" };
      next.live = { ...next.live, enabled: true };
      next.notice = { ...next.notice, enabled: true, background: "#0f172a", textColor: "#ffffff" };
      break;
    case "minimalista":
      next.colors = {
        ...next.colors,
        palette: "custom",
        primary: "#0f172a",
        button: "#0f172a",
        background: "#ffffff",
        surface: "#ffffff",
        border: "#e5e7eb",
      };
      next.typography = { ...next.typography, fontFamily: "sans", headingWeight: 600 };
      next.layout = { ...next.layout, radius: 6 };
      next.scarcity = { ...next.scarcity, enabled: false };
      next.social = { ...next.social, enabled: false };
      next.live = { ...next.live, enabled: false };
      next.notice = { ...next.notice, enabled: false };
      next.banner = { ...next.banner, enabled: false };
      break;
    case "premium":
      next.colors = {
        ...next.colors,
        palette: "custom",
        primary: "#1d4ed8",
        button: "#111827",
        background: "#f8fafc",
        surface: "#ffffff",
        border: "#e2e8f0",
      };
      next.typography = { ...next.typography, fontFamily: "display", headingSize: 22, headingWeight: 700 };
      next.layout = { ...next.layout, radius: 18, width: 560 };
      next.social = { ...next.social, enabled: true, layout: "rating" };
      next.scarcity = { ...next.scarcity, enabled: false };
      break;
    case "dark":
      next.colors = { ...next.colors, palette: "escuro", ...PALETTES.escuro.colors };
      next.header = { ...next.header, background: "#1e293b", textColor: "#f8fafc" };
      next.divider = { ...next.divider, color: "#ffffff" };
      next.footer = { ...next.footer, color: "#94a3b8" };
      next.typography = { ...next.typography, fontFamily: "display" };
      next.layout = { ...next.layout, radius: 14 };
      break;
  }
  return next;
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function defaultConfig(): CheckoutConfig {
  return baseConfig();
}

/** Faz merge do config salvo (parcial/antigo) com os defaults atuais. */
const BLOCK_POSITIONS: BlockPosition[] = [
  "top",
  "before-product",
  "after-product",
  "before-identification",
  "after-identification",
  "before-payment",
  "after-payment",
  "after-summary",
  "before-footer",
  "end",
];

function isBlockPosition(v: unknown): v is BlockPosition {
  return typeof v === "string" && (BLOCK_POSITIONS as string[]).includes(v);
}

/** Opções de posição para o card de Resumo (não pode ficar "depois do resumo"). */
export const SUMMARY_POSITIONS: { value: BlockPosition; label: string }[] = [
  { value: "top", label: "Topo do checkout" },
  { value: "before-product", label: "Antes do produto" },
  { value: "after-product", label: "Depois do produto" },
  { value: "before-identification", label: "Antes da Identificação" },
  { value: "after-identification", label: "Depois da Identificação" },
  { value: "before-payment", label: "Antes do Pagamento" },
  { value: "after-payment", label: "Depois do Pagamento" },
  { value: "before-footer", label: "Antes do rodapé (padrão)" },
  { value: "end", label: "Final do checkout" },
];

/** Opções de posição para o Cupom, incluindo a âncora relativa ao Resumo. */
export const COUPON_POSITIONS: { value: BlockPosition; label: string }[] = [
  { value: "after-summary", label: "Junto ao resumo (padrão)" },
  { value: "top", label: "Topo do checkout" },
  { value: "before-product", label: "Antes do produto" },
  { value: "after-product", label: "Depois do produto" },
  { value: "before-identification", label: "Antes da Identificação" },
  { value: "after-identification", label: "Depois da Identificação" },
  { value: "before-payment", label: "Antes do Pagamento" },
  { value: "after-payment", label: "Depois do Pagamento" },
  { value: "before-footer", label: "Antes do rodapé" },
  { value: "end", label: "Final do checkout" },
];

/** Âncoras que só aparecem enquanto uma etapa específica está ativa, quando
 *  o checkout está no modo "em etapas". Usado só para exibir um aviso no
 *  Builder — a renderização em si já respeita isso naturalmente. */
export const STEP_SCOPED_POSITIONS: Partial<Record<BlockPosition, StepKey>> = {
  "before-identification": "identificacao",
  "after-identification": "identificacao",
  "before-payment": "pagamento",
  "after-payment": "pagamento",
};

export function normalizeConfig(raw: unknown): CheckoutConfig {
  const base = baseConfig();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const obj = (key: keyof CheckoutConfig) =>
    (r[key] && typeof r[key] === "object" ? (r[key] as Record<string, unknown>) : {});
  const arr = <T>(key: keyof CheckoutConfig, sub: string, fallback: T[]): T[] => {
    const section = obj(key);
    const value = section[sub];
    return Array.isArray(value) && value.length ? (value as T[]) : fallback;
  };

  return {
    mode: r["mode"] === "advanced" ? "advanced" : "quick",
    preset: (["conversao", "minimalista", "premium", "dark"] as PresetKey[]).includes(r["preset"] as PresetKey)
      ? (r["preset"] as PresetKey)
      : base.preset,
    header: { ...base.header, ...obj("header") },
    divider: { ...base.divider, ...obj("divider") },
    notice: { ...base.notice, ...obj("notice"), messages: arr("notice", "messages", base.notice.messages) },
    banner: { ...base.banner, ...obj("banner") },
    summary: {
      ...base.summary,
      ...obj("summary"),
      position: isBlockPosition(obj("summary")["position"]) ? (obj("summary")["position"] as BlockPosition) : base.summary.position,
    },
    // O cupom morava dentro de "summary" (couponEnabled/couponFirst). Migra
    // configs antigas automaticamente, preservando a intenção original.
    coupon: (() => {
      const legacySummary = obj("summary");
      const hasOwnSection = r["coupon"] && typeof r["coupon"] === "object";
      if (hasOwnSection) {
        const section = obj("coupon");
        return {
          enabled: typeof section["enabled"] === "boolean" ? (section["enabled"] as boolean) : base.coupon.enabled,
          position: isBlockPosition(section["position"]) ? (section["position"] as BlockPosition) : base.coupon.position,
        };
      }
      const legacyEnabled =
        typeof legacySummary["couponEnabled"] === "boolean" ? (legacySummary["couponEnabled"] as boolean) : base.coupon.enabled;
      const legacyFirst = legacySummary["couponFirst"] === true;
      return { enabled: legacyEnabled, position: legacyFirst ? ("before-identification" as BlockPosition) : base.coupon.position };
    })(),
    steps: {
      ...base.steps,
      ...obj("steps"),
      labels: {
        ...base.steps.labels,
        ...((obj("steps")["labels"] && typeof obj("steps")["labels"] === "object"
          ? (obj("steps")["labels"] as Partial<Record<StepKey, string>>)
          : {}) as Partial<Record<StepKey, string>>),
      },
    },
    scarcity: { ...base.scarcity, ...obj("scarcity") },
    social: { ...base.social, ...obj("social"), testimonials: arr("social", "testimonials", base.social.testimonials) },
    live: { ...base.live, ...obj("live") },
    payment: { ...base.payment, ...obj("payment") },
    colors: { ...base.colors, ...obj("colors") },
    typography: { ...base.typography, ...obj("typography") },
    footer: { ...base.footer, ...obj("footer") },
    security: { ...base.security, ...obj("security"), items: arr("security", "items", base.security.items) },
    product: { ...base.product, ...obj("product") },
    identification: { ...base.identification, ...obj("identification") },
    button: { ...base.button, ...obj("button") },
    layout: { ...base.layout, ...obj("layout") },
    fields: {
      customer: arr("fields", "customer", base.fields.customer),
      address: arr("fields", "address", base.fields.address),
      required: arr("fields", "required", base.fields.required),
    },
  };
}

/* ───────────────────────── validações e máscaras ─────────────────────────
 * Utilitários puros usados pelo simulador/preview interativo. Nenhuma regra de
 * negócio: apenas validam formato/dígitos para dar feedback ao lojista durante
 * o teste do checkout. Não persistem nada.
 */

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCNPJ(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function maskCEP(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function isValidPhone(v: string) {
  const d = onlyDigits(v);
  return d.length === 10 || d.length === 11;
}

export function isValidCEP(v: string) {
  return onlyDigits(v).length === 8;
}

export function isValidCPF(v: string) {
  const cpf = onlyDigits(v);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(cpf[10]);
}

export function isValidCNPJ(v: string) {
  const cnpj = onlyDigits(v);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cnpj[i]) * (weights[i] ?? 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  if (calc(12) !== Number(cnpj[12])) return false;
  return calc(13) === Number(cnpj[13]);
}

export const RECOMMENDATIONS = [
  {
    title: "Ative o Pix como padrão",
    detail: "A maioria das vendas aprovadas vem de Pix — deixe-o como primeira opção.",
  },
  {
    title: "Reduza os campos do formulário",
    detail: "Menos campos costumam diminuir o abandono no mobile.",
  },
  {
    title: "Use prova social acima do botão",
    detail: "Depoimentos próximos ao CTA reforçam a confiança na hora da decisão.",
  },
];

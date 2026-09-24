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

export type NoticeMessage = { id: string; text: string };
export type StepItem = { id: string; label: string; icon: string; enabled: boolean };
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
  couponEnabled: boolean;
  couponFirst: boolean;
  installmentsEnabled: boolean;
};

export type StepsConfig = {
  enabled: boolean;
  style: StepsStyle;
  items: StepItem[];
  showNumbers: boolean;
  showProgress: boolean;
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
  title: string;
  description: string;
  price: number;
  compareAt: number;
  showCompare: boolean;
  showDiscount: boolean;
  showQuantity: boolean;
  image?: string | undefined;
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
      couponEnabled: true,
      couponFirst: false,
      installmentsEnabled: true,
    },
    steps: {
      enabled: true,
      style: "line",
      showNumbers: true,
      showProgress: true,
      items: [
        { id: newId("step"), label: "Identificação", icon: "user", enabled: true },
        { id: newId("step"), label: "Entrega", icon: "truck", enabled: true },
        { id: newId("step"), label: "Pagamento", icon: "card", enabled: true },
      ],
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
      title: "Kit Premium",
      description: "Acesso completo + bônus exclusivos e suporte por 12 meses.",
      price: 197,
      compareAt: 297,
      showCompare: true,
      showDiscount: true,
      showQuantity: true,
    },
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
    summary: { ...base.summary, ...obj("summary") },
    steps: { ...base.steps, ...obj("steps"), items: arr("steps", "items", base.steps.items) },
    scarcity: { ...base.scarcity, ...obj("scarcity") },
    social: { ...base.social, ...obj("social"), testimonials: arr("social", "testimonials", base.social.testimonials) },
    live: { ...base.live, ...obj("live") },
    payment: { ...base.payment, ...obj("payment") },
    colors: { ...base.colors, ...obj("colors") },
    typography: { ...base.typography, ...obj("typography") },
    footer: { ...base.footer, ...obj("footer") },
    security: { ...base.security, ...obj("security"), items: arr("security", "items", base.security.items) },
    product: { ...base.product, ...obj("product") },
    button: { ...base.button, ...obj("button") },
    layout: { ...base.layout, ...obj("layout") },
    fields: {
      customer: arr("fields", "customer", base.fields.customer),
      address: arr("fields", "address", base.fields.address),
      required: arr("fields", "required", base.fields.required),
    },
  };
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

/**
 * Estrutura de dados da área de Marketing.
 *
 * IMPORTANTE: esta camada NÃO contém entidades fictícias. As listas de cupons,
 * order bumps, upsells, brindes, provas sociais, testes A/B e automações começam
 * VAZIAS — não existe fonte real para elas ainda, então a UI renderiza o estado
 * vazio ("Nenhum ... configurado") em vez de inventar registros. Quando o backend
 * (Supabase/API) existir, basta popular estas listas mantendo os mesmos tipos.
 *
 * O que permanece aqui é apenas configuração/catálogo (não são dados de conta):
 * - `OVERVIEW_STATS`: métricas zeradas até haver dados reais.
 * - `PIXEL_PLATFORMS`: catálogo de integrações disponíveis para conectar (nenhuma
 *   aparece como conectada, pois não há conexão real).
 * - `PIXEL_EVENTS` / `CHECKOUT_EVENTS`: mapeamento fixo de eventos do checkout.
 */

export type MarketingToolStatus =
  | "Ativo"
  | "Disponível"
  | "Configurando"
  | "Erro"
  | "Pausado"
  | "Rascunho";

/* -------------------------------------------------------------------------- */
/* Visão geral (métricas zeradas até existir fonte real)                      */
/* -------------------------------------------------------------------------- */

export const OVERVIEW_STATS = [
  { key: "conversoes", label: "Conversões", value: "0", hint: "Últimos 30 dias" },
  { key: "receita", label: "Receita influenciada", value: "R$ 0,00", hint: "Últimos 30 dias" },
  { key: "taxa", label: "Taxa de conversão", value: "0,00%", hint: "Últimos 30 dias" },
  { key: "recuperacoes", label: "Recuperações", value: "0", hint: "Últimos 30 dias" },
  { key: "campanhas", label: "Campanhas ativas", value: "0", hint: "Agora" },
] as const;

/* -------------------------------------------------------------------------- */
/* Pixels e rastreamento                                                      */
/* Catálogo de plataformas disponíveis para conectar. Nenhuma inicia conectada */
/* (connections: 0, sem último evento) porque não há integração real ativa.   */
/* -------------------------------------------------------------------------- */

export type PixelPlatform = {
  id: string;
  name: string;
  tag: string;
  color: string;
  description: string;
  status: MarketingToolStatus;
  connections: number;
  lastEvent: string | null;
};

export const PIXEL_PLATFORMS: PixelPlatform[] = [
  {
    id: "meta",
    name: "Meta Pixel",
    tag: "M",
    color: "#1877F2",
    description: "Conversões, remarketing e otimização de campanhas.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "google-ads",
    name: "Google Ads",
    tag: "Ads",
    color: "#4285F4",
    description: "Rastreie conversões e otimize seus lances.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "tiktok",
    name: "TikTok Pixel",
    tag: "TT",
    color: "#010101",
    description: "Acompanhe eventos e otimize campanhas no TikTok.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    tag: "GTM",
    color: "#246FDB",
    description: "Gerencie todas as suas tags em um só lugar.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "ga4",
    name: "Google Analytics",
    tag: "GA4",
    color: "#E37400",
    description: "Análise completa do comportamento no checkout.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    tag: "P",
    color: "#E60023",
    description: "Rastreie conversões vindas do Pinterest.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "kwai",
    name: "Kwai",
    tag: "K",
    color: "#FF6A00",
    description: "Otimize campanhas de aquisição no Kwai.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "taboola",
    name: "Taboola",
    tag: "Tb",
    color: "#0B48A0",
    description: "Rastreie conversões de native ads.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "microsoft-ads",
    name: "Microsoft Ads",
    tag: "MS",
    color: "#00A4EF",
    description: "Conversões e remarketing na rede da Microsoft.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
  {
    id: "snap",
    name: "Snap Pixel",
    tag: "S",
    color: "#FFFC00",
    description: "Acompanhe eventos e conversões no Snapchat.",
    status: "Disponível",
    connections: 0,
    lastEvent: null,
  },
];

export const PIXEL_EVENTS = [
  { id: "PageView", label: "PageView", description: "Toda visualização de página", active: true },
  { id: "ViewContent", label: "ViewContent", description: "Visualização do produto", active: true },
  { id: "AddToCart", label: "AddToCart", description: "Adição ao carrinho", active: true },
  { id: "InitiateCheckout", label: "InitiateCheckout", description: "Início do checkout", active: true },
  { id: "Purchase", label: "Purchase", description: "Compra aprovada", active: true },
  { id: "Lead", label: "Lead", description: "Captura de contato", active: false },
] as const;

export const CHECKOUT_EVENTS = [
  { id: "visit", label: "Visita ao checkout", event: "PageView" },
  { id: "view", label: "Visualização do produto", event: "ViewContent" },
  { id: "add", label: "Adição ao carrinho", event: "AddToCart" },
  { id: "start", label: "Início do checkout", event: "InitiateCheckout" },
  { id: "payment", label: "Pagamento iniciado", event: "AddPaymentInfo" },
  { id: "purchase", label: "Compra aprovada", event: "Purchase" },
] as const;

/* -------------------------------------------------------------------------- */
/* Cupons                                                                     */
/* -------------------------------------------------------------------------- */

export type Coupon = {
  id: string;
  code: string;
  discount: string;
  type: "Percentual" | "Valor fixo";
  used: number;
  limit: number | null;
  validity: string;
  status: MarketingToolStatus;
};

export const COUPONS: Coupon[] = [];

/* -------------------------------------------------------------------------- */
/* Order Bump                                                                 */
/* -------------------------------------------------------------------------- */

export type OrderBump = {
  id: string;
  mainProduct: string;
  offer: string;
  price: string;
  discount: string;
  checkout: string;
  status: MarketingToolStatus;
  conversion: string;
};

export const ORDER_BUMPS: OrderBump[] = [];

/* -------------------------------------------------------------------------- */
/* Upsell                                                                     */
/* -------------------------------------------------------------------------- */

export type Upsell = {
  id: string;
  trigger: string;
  offer: string;
  price: string;
  checkout: string;
  status: MarketingToolStatus;
  conversion: string;
};

export const UPSELLS: Upsell[] = [];

/* -------------------------------------------------------------------------- */
/* Brindes                                                                    */
/* -------------------------------------------------------------------------- */

export type Gift = {
  id: string;
  condition: string;
  reward: string;
  minValue: string;
  checkout: string;
  status: MarketingToolStatus;
};

export const GIFTS: Gift[] = [];

/* -------------------------------------------------------------------------- */
/* Provas sociais                                                             */
/* -------------------------------------------------------------------------- */

export type SocialProof = {
  id: string;
  name: string;
  text: string;
  rating: number;
  date: string;
  product: string;
  status: MarketingToolStatus;
};

export const SOCIAL_PROOFS: SocialProof[] = [];

/* -------------------------------------------------------------------------- */
/* A/B Testing                                                                */
/* -------------------------------------------------------------------------- */

export type ABTest = {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  traffic: string;
  metric: string;
  status: MarketingToolStatus;
};

export const AB_TESTS: ABTest[] = [];

/* -------------------------------------------------------------------------- */
/* Automação                                                                  */
/* -------------------------------------------------------------------------- */

export type Automation = {
  id: string;
  trigger: string;
  action: string;
  status: MarketingToolStatus;
};

export const AUTOMATIONS: Automation[] = [];

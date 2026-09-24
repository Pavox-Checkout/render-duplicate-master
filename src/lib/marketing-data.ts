/**
 * Dados de demonstração (mock) da área de Marketing.
 *
 * IMPORTANTE: nada aqui representa dados reais. Toda esta camada existe apenas
 * para demonstrar visualmente os estados (vazio, populado, ativo/inativo) das
 * telas. A estrutura foi desenhada para que o DEV substitua estes mocks por
 * dados reais (Supabase/API) posteriormente sem alterar a UI.
 */

export type MarketingToolStatus =
  | "Ativo"
  | "Disponível"
  | "Configurando"
  | "Erro"
  | "Pausado"
  | "Rascunho";

/* -------------------------------------------------------------------------- */
/* Checkouts (mock — substituir por checkouts reais do usuário)               */
/* -------------------------------------------------------------------------- */

export const MOCK_CHECKOUTS = [
  { id: "all", name: "Todos os checkouts" },
  { id: "checkout-a", name: "Checkout Produto A" },
  { id: "checkout-b", name: "Checkout Produto B" },
] as const;

/* -------------------------------------------------------------------------- */
/* Visão geral                                                                */
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
    status: "Ativo",
    connections: 1,
    lastEvent: "Purchase · há 4 min",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    tag: "Ads",
    color: "#4285F4",
    description: "Rastreie conversões e otimize seus lances.",
    status: "Configurando",
    connections: 1,
    lastEvent: null,
  },
  {
    id: "tiktok",
    name: "TikTok Pixel",
    tag: "TT",
    color: "#010101",
    description: "Acompanhe eventos e otimize campanhas no TikTok.",
    status: "Ativo",
    connections: 2,
    lastEvent: "InitiateCheckout · há 12 min",
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
    status: "Erro",
    connections: 1,
    lastEvent: "Token inválido",
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

export const COUPONS: Coupon[] = [
  { id: "1", code: "BEMVINDO10", discount: "10%", type: "Percentual", used: 128, limit: 500, validity: "31/12/2026", status: "Ativo" },
  { id: "2", code: "PIX15", discount: "15%", type: "Percentual", used: 342, limit: null, validity: "Sem prazo", status: "Ativo" },
  { id: "3", code: "BLACK50", discount: "R$ 50,00", type: "Valor fixo", used: 0, limit: 1000, validity: "28/11/2026", status: "Rascunho" },
  { id: "4", code: "FRETEGRATIS", discount: "R$ 19,90", type: "Valor fixo", used: 87, limit: 200, validity: "Expirado", status: "Pausado" },
];

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

export const ORDER_BUMPS: OrderBump[] = [
  { id: "1", mainProduct: "Curso Completo", offer: "Mentoria Individual", price: "R$ 97,00", discount: "40%", checkout: "Checkout Produto A", status: "Ativo", conversion: "23,4%" },
  { id: "2", mainProduct: "Ebook Premium", offer: "Planilhas Extras", price: "R$ 29,90", discount: "50%", checkout: "Checkout Produto B", status: "Pausado", conversion: "11,8%" },
];

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

export const UPSELLS: Upsell[] = [
  { id: "1", trigger: "Curso Completo", offer: "Acesso Vitalício", price: "R$ 197,00", checkout: "Checkout Produto A", status: "Ativo", conversion: "18,2%" },
  { id: "2", trigger: "Plano Mensal", offer: "Upgrade Anual", price: "R$ 490,00", checkout: "Checkout Produto B", status: "Rascunho", conversion: "—" },
];

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

export const GIFTS: Gift[] = [
  { id: "1", condition: "Compre 2 produtos", reward: "Ebook exclusivo", minValue: "R$ 150,00", checkout: "Todos os checkouts", status: "Ativo" },
  { id: "2", condition: "Acima de R$ 300", reward: "Frete grátis", minValue: "R$ 300,00", checkout: "Checkout Produto A", status: "Pausado" },
];

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

export const SOCIAL_PROOFS: SocialProof[] = [
  { id: "1", name: "Cliente Demonstração", text: "Melhor compra que fiz este ano, recomendo demais!", rating: 5, date: "12/03/2026", product: "Curso Completo", status: "Ativo" },
  { id: "2", name: "Comprador Exemplo", text: "Entrega rápida e produto de altíssima qualidade.", rating: 5, date: "08/03/2026", product: "Ebook Premium", status: "Ativo" },
  { id: "3", name: "Usuário Fictício", text: "Suporte excelente, tirou todas as minhas dúvidas.", rating: 4, date: "01/03/2026", product: "Mentoria", status: "Rascunho" },
];

/* -------------------------------------------------------------------------- */
/* Compra ao vivo (dados 100% fictícios e demonstrativos)                     */
/* -------------------------------------------------------------------------- */

export const LIVE_PURCHASES = [
  { id: "1", name: "João", city: "São Paulo", product: "Curso Completo", time: "agora mesmo" },
  { id: "2", name: "Maria", city: "Rio de Janeiro", product: "Ebook Premium", time: "há 2 minutos" },
  { id: "3", name: "Carlos", city: "Belo Horizonte", product: "Mentoria", time: "há 5 minutos" },
  { id: "4", name: "Ana", city: "Curitiba", product: "Curso Completo", time: "há 8 minutos" },
] as const;

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

export const AB_TESTS: ABTest[] = [
  { id: "1", name: "Cor do botão de compra", variantA: "Checkout A", variantB: "Checkout B", traffic: "50 / 50", metric: "Conversão", status: "Ativo" },
  { id: "2", name: "Título da oferta", variantA: "Checkout A", variantB: "Checkout B", traffic: "70 / 30", metric: "Ticket médio", status: "Pausado" },
];

/* -------------------------------------------------------------------------- */
/* Automação                                                                  */
/* -------------------------------------------------------------------------- */

export type Automation = {
  id: string;
  trigger: string;
  action: string;
  status: MarketingToolStatus;
};

export const AUTOMATIONS: Automation[] = [
  { id: "1", trigger: "Checkout abandonado", action: "Enviar recuperação por WhatsApp", status: "Ativo" },
  { id: "2", trigger: "Compra aprovada", action: "Disparar evento Purchase para os pixels", status: "Ativo" },
  { id: "3", trigger: "Cliente comprou", action: "Iniciar fluxo de pós-venda", status: "Rascunho" },
];

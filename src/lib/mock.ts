export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const num = (value: number) => value.toLocaleString("pt-BR");

export const user = {
  name: "João Martins",
  email: "joao@lojademo.com",
  initials: "JM",
  company: "Loja Demo",
};

export type Metric = {
  label: string;
  value: string;
  delta: number;
  hint: string;
  icon: "revenue" | "orders" | "ticket" | "conversion";
};

export const metrics: Metric[] = [
  {
    label: "Faturamento",
    value: "R$ 128.450,90",
    delta: 18.4,
    hint: "vs. período anterior",
    icon: "revenue",
  },
  { label: "Pedidos", value: "1.284", delta: 12.8, hint: "vs. período anterior", icon: "orders" },
  {
    label: "Ticket médio",
    value: "R$ 100,04",
    delta: 4.6,
    hint: "vs. período anterior",
    icon: "ticket",
  },
  {
    label: "Taxa de conversão",
    value: "4,82%",
    delta: 0.74,
    hint: "vs. período anterior",
    icon: "conversion",
  },
];

const base = [
  3120, 2890, 3410, 4020, 3760, 4890, 5210, 4120, 3980, 4460, 5120, 5890, 6240, 5380, 4970, 5420,
  6180, 6720, 5940, 5310, 5880, 6410, 7020, 6580, 6120, 6890, 7420, 7980, 7310, 8150,
];

export const salesSeries = base.map((v, i) => {
  const day = new Date(2026, 8, 21 - (29 - i));
  const orders = Math.round(v / 100 + (i % 5) * 3);
  return {
    date: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    faturamento: v,
    pedidos: orders,
    ticket: Math.round((v / orders) * 100) / 100,
  };
});

export const funnel = [
  { label: "Visitantes", value: 26840 },
  { label: "Iniciaram checkout", value: 8492 },
  { label: "Informaram dados", value: 6731 },
  { label: "Pagamento iniciado", value: 5248 },
  { label: "Compras aprovadas", value: 4917 },
];

export type OrderStatus = "Aprovado" | "Pendente" | "Recusado" | "Reembolsado";

export type Order = {
  id: string;
  customer: string;
  email: string;
  product: string;
  amount: number;
  status: OrderStatus;
  gateway: string;
  method: string;
  date: string;
};

export const orders: Order[] = [
  {
    id: "PVX-10482",
    customer: "Carlos Henrique",
    email: "carlos.h@gmail.com",
    product: "Kit Premium",
    amount: 297,
    status: "Aprovado",
    gateway: "Stripe",
    method: "Cartão",
    date: "Hoje, 10:42",
  },
  {
    id: "PVX-10481",
    customer: "Mariana Costa",
    email: "mari.costa@outlook.com",
    product: "Curso Online",
    amount: 197,
    status: "Aprovado",
    gateway: "Mercado Pago",
    method: "Pix",
    date: "Hoje, 10:37",
  },
  {
    id: "PVX-10480",
    customer: "Lucas Almeida",
    email: "lucas.almeida@gmail.com",
    product: "Produto Digital",
    amount: 89.9,
    status: "Pendente",
    gateway: "Pagar.me",
    method: "Boleto",
    date: "Hoje, 10:21",
  },
  {
    id: "PVX-10479",
    customer: "Fernanda Lima",
    email: "fe.lima@gmail.com",
    product: "Mentoria Individual",
    amount: 1497,
    status: "Aprovado",
    gateway: "Stripe",
    method: "Cartão",
    date: "Hoje, 09:58",
  },
  {
    id: "PVX-10478",
    customer: "Rafael Souza",
    email: "rafael.souza@uol.com.br",
    product: "Kit Premium",
    amount: 297,
    status: "Recusado",
    gateway: "Asaas",
    method: "Cartão",
    date: "Hoje, 09:32",
  },
  {
    id: "PVX-10477",
    customer: "Juliana Prado",
    email: "ju.prado@gmail.com",
    product: "Curso Online",
    amount: 197,
    status: "Aprovado",
    gateway: "Mercado Pago",
    method: "Pix",
    date: "Ontem, 22:14",
  },
  {
    id: "PVX-10476",
    customer: "Bruno Tavares",
    email: "bruno.tv@gmail.com",
    product: "Combo Anual",
    amount: 897,
    status: "Reembolsado",
    gateway: "Stripe",
    method: "Cartão",
    date: "Ontem, 20:03",
  },
  {
    id: "PVX-10475",
    customer: "Patrícia Nunes",
    email: "patricia.n@gmail.com",
    product: "Produto Digital",
    amount: 89.9,
    status: "Aprovado",
    gateway: "Pagar.me",
    method: "Pix",
    date: "Ontem, 19:41",
  },
  {
    id: "PVX-10474",
    customer: "Diego Ramos",
    email: "diego.ramos@gmail.com",
    product: "Kit Premium",
    amount: 297,
    status: "Pendente",
    gateway: "Asaas",
    method: "Boleto",
    date: "Ontem, 18:12",
  },
  {
    id: "PVX-10473",
    customer: "Aline Ferreira",
    email: "aline.f@gmail.com",
    product: "Mentoria Individual",
    amount: 1497,
    status: "Aprovado",
    gateway: "Stripe",
    method: "Cartão",
    date: "Ontem, 16:49",
  },
];

export const products = [
  {
    id: "p1",
    name: "Kit Premium",
    sku: "PVX-KIT-01",
    price: 297,
    sales: 412,
    revenue: 122364,
    status: "Ativo",
  },
  {
    id: "p2",
    name: "Curso Online",
    sku: "PVX-CUR-02",
    price: 197,
    sales: 386,
    revenue: 76042,
    status: "Ativo",
  },
  {
    id: "p3",
    name: "Produto Digital",
    sku: "PVX-DIG-03",
    price: 89.9,
    sales: 298,
    revenue: 26790,
    status: "Ativo",
  },
  {
    id: "p4",
    name: "Mentoria Individual",
    sku: "PVX-MEN-04",
    price: 1497,
    sales: 64,
    revenue: 95808,
    status: "Ativo",
  },
  {
    id: "p5",
    name: "Combo Anual",
    sku: "PVX-CMB-05",
    price: 897,
    sales: 41,
    revenue: 36777,
    status: "Rascunho",
  },
];

export const checkouts = [
  {
    id: "c1",
    name: "Checkout Principal",
    product: "Kit Premium",
    conversion: 4.82,
    sales: 1284,
    revenue: 128450,
    status: "Ativo",
  },
  {
    id: "c2",
    name: "Checkout Black Friday",
    product: "Combo Anual",
    conversion: 6.41,
    sales: 824,
    revenue: 84230,
    status: "Ativo",
  },
  {
    id: "c3",
    name: "Checkout Curso Online",
    product: "Curso Online",
    conversion: 3.94,
    sales: 386,
    revenue: 76042,
    status: "Ativo",
  },
  {
    id: "c4",
    name: "Checkout Mentoria",
    product: "Mentoria Individual",
    conversion: 2.18,
    sales: 64,
    revenue: 95808,
    status: "Pausado",
  },
];

export const customers = [
  {
    id: "u1",
    name: "Carlos Henrique",
    email: "carlos.h@gmail.com",
    orders: 6,
    spent: 1782,
    ltv: 2140,
    last: "Hoje",
  },
  {
    id: "u2",
    name: "Mariana Costa",
    email: "mari.costa@outlook.com",
    orders: 4,
    spent: 788,
    ltv: 1180,
    last: "Hoje",
  },
  {
    id: "u3",
    name: "Fernanda Lima",
    email: "fe.lima@gmail.com",
    orders: 3,
    spent: 4491,
    ltv: 5200,
    last: "Hoje",
  },
  {
    id: "u4",
    name: "Lucas Almeida",
    email: "lucas.almeida@gmail.com",
    orders: 2,
    spent: 179.8,
    ltv: 320,
    last: "Ontem",
  },
  {
    id: "u5",
    name: "Juliana Prado",
    email: "ju.prado@gmail.com",
    orders: 5,
    spent: 985,
    ltv: 1440,
    last: "Ontem",
  },
  {
    id: "u6",
    name: "Bruno Tavares",
    email: "bruno.tv@gmail.com",
    orders: 1,
    spent: 897,
    ltv: 897,
    last: "2 dias",
  },
];

export const abandoned = [
  {
    id: "a1",
    name: "Renata Vieira",
    email: "renata.v@gmail.com",
    phone: "(11) 98812-4410",
    product: "Kit Premium",
    amount: 297,
    step: "Pagamento",
    time: "12 min atrás",
  },
  {
    id: "a2",
    name: "Thiago Moreira",
    email: "thiago.m@gmail.com",
    phone: "(21) 99741-2280",
    product: "Curso Online",
    amount: 197,
    step: "Dados do cliente",
    time: "34 min atrás",
  },
  {
    id: "a3",
    name: "Camila Duarte",
    email: "camila.d@gmail.com",
    phone: "(31) 98330-7712",
    product: "Combo Anual",
    amount: 897,
    step: "Pagamento",
    time: "1 h atrás",
  },
  {
    id: "a4",
    name: "Eduardo Pires",
    email: "edu.pires@gmail.com",
    phone: "(41) 99122-3388",
    product: "Mentoria Individual",
    amount: 1497,
    step: "Início do checkout",
    time: "2 h atrás",
  },
  {
    id: "a5",
    name: "Sabrina Rocha",
    email: "sabrina.r@gmail.com",
    phone: "(51) 98474-9021",
    product: "Produto Digital",
    amount: 89.9,
    step: "Pagamento",
    time: "3 h atrás",
  },
];

export const deviceData = [
  { name: "Mobile", value: 5.34 },
  { name: "Desktop", value: 4.12 },
  { name: "Tablet", value: 2.87 },
];

export const sourceData = [
  { name: "Instagram Ads", value: 6.12 },
  { name: "Google Ads", value: 4.78 },
  { name: "Orgânico", value: 3.94 },
  { name: "E-mail", value: 7.21 },
  { name: "Direto", value: 3.11 },
];

export const productConversion = [
  { name: "Kit Premium", value: 5.62 },
  { name: "Curso Online", value: 4.31 },
  { name: "Produto Digital", value: 3.88 },
  { name: "Mentoria", value: 2.18 },
  { name: "Combo Anual", value: 4.94 },
];

export const hourData = Array.from({ length: 12 }, (_, i) => ({
  name: `${String(i * 2).padStart(2, "0")}h`,
  value: Math.round((2 + Math.sin(i / 1.8) * 2.2 + (i > 7 ? 1.4 : 0)) * 100) / 100,
}));

export const paymentMix = [
  { name: "Pix", value: 48 },
  { name: "Cartão", value: 41 },
  { name: "Boleto", value: 11 },
];

export const integrations = [
  {
    name: "Stripe",
    category: "Pagamentos",
    desc: "Receba com cartão internacional e assinaturas.",
    status: "Conectado",
    color: "#635BFF",
    tag: "ST",
  },
  {
    name: "Mercado Pago",
    category: "Pagamentos",
    desc: "Pix, cartão e boleto com alta aprovação no Brasil.",
    status: "Conectado",
    color: "#00B1EA",
    tag: "MP",
  },
  {
    name: "Pagar.me",
    category: "Pagamentos",
    desc: "Gateway brasileiro com split de pagamentos.",
    status: "Disponível",
    color: "#65A300",
    tag: "PG",
  },
  {
    name: "Asaas",
    category: "Pagamentos",
    desc: "Cobranças recorrentes e gestão financeira.",
    status: "Disponível",
    color: "#1E3A8A",
    tag: "AS",
  },
  {
    name: "Shopify",
    category: "E-commerce",
    desc: "Sincronize produtos e pedidos da sua loja.",
    status: "Disponível",
    color: "#95BF47",
    tag: "SH",
  },
  {
    name: "WooCommerce",
    category: "E-commerce",
    desc: "Conecte sua loja WordPress ao checkout PAVOX.",
    status: "Disponível",
    color: "#7F54B3",
    tag: "WC",
  },
  {
    name: "Nuvemshop",
    category: "E-commerce",
    desc: "Integração nativa com catálogo e pedidos.",
    status: "Disponível",
    color: "#2C3357",
    tag: "NS",
  },
  {
    name: "Google Analytics",
    category: "Analytics",
    desc: "Envie eventos de checkout e compra ao GA4.",
    status: "Conectado",
    color: "#E37400",
    tag: "GA",
  },
  {
    name: "Meta Pixel",
    category: "Marketing",
    desc: "Rastreie conversões e otimize campanhas.",
    status: "Disponível",
    color: "#0866FF",
    tag: "MT",
  },
];

export const webhookEvents = [
  "order.created",
  "payment.pending",
  "payment.approved",
  "payment.failed",
  "checkout.started",
  "checkout.completed",
];

export const team = [
  { name: "João Martins", email: "joao@lojademo.com", role: "Proprietário", status: "Ativo" },
  { name: "Renata Alves", email: "renata@lojademo.com", role: "Administrador", status: "Ativo" },
  { name: "Pedro Barros", email: "pedro@lojademo.com", role: "Financeiro", status: "Ativo" },
  { name: "Marcos Dias", email: "marcos@lojademo.com", role: "Analista", status: "Convidado" },
];

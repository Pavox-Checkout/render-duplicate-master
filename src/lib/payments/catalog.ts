// Payment gateway catalog + shared domain types for the Integrações module.
//
// PAVOX is not a gateway. This catalog only describes WHICH gateways an account
// can connect and WHAT each one needs (credentials, methods, environments).
// The real gateway API calls / webhooks / Payment Engine are a later phase; the
// shape here is intentionally prepared for per-method routing adapters.

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type PaymentMethod = "pix" | "card" | "boleto";
export type Environment = "sandbox" | "production";
export type IntegrationStatus = "not_connected" | "connected" | "disabled" | "error";

export type CredentialField = {
  key: string;
  label: string;
  hint?: string;
  secret: boolean;
};

export type ProviderKind = "payment" | "ecommerce" | "analytics" | "marketing";

export type ProviderDef = {
  id: string;
  name: string;
  /** Display category used by the filter tabs. */
  category: string;
  kind: ProviderKind;
  desc: string;
  color: string;
  tag: string;
  credentialFields: CredentialField[];
  methods: PaymentMethod[];
  environments: Environment[];
  /** Backend adapter implemented: the integration can actually charge. */
  live: boolean;
  /** Supports "Conectar com {name}" (OAuth) — no keys to paste, fee via split. */
  oauth?: boolean;
  /** PAVOX registers the payment webhook on the account by itself. */
  autoWebhook?: boolean;
  referenceLogo?: { source: string; x: number; y: number };
};

/** A persisted integration as it is safely exposed to the client (no raw secrets). */
export type SavedIntegration = {
  id: string;
  provider: string;
  environment: Environment;
  status: IntegrationStatus;
  enabledMethods: PaymentMethod[];
  maskedCredentials: Record<string, string>;
  routing: Record<string, JsonValue>;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  accountLabel: string;
  /** "oauth" = connected with the provider's login; "manual" = pasted keys. */
  connectionType: "manual" | "oauth";
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  card: "Cartão",
  boleto: "Boleto",
};

export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  sandbox: "Sandbox / Teste",
  production: "Produção",
};

export const STATUS_LABELS: Record<IntegrationStatus, string> = {
  not_connected: "Não conectado",
  connected: "Conectado",
  disabled: "Desativado",
  error: "Erro",
};

export const PROVIDERS: ProviderDef[] = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    category: "Pagamentos",
    kind: "payment",
    desc: "Pix, cartão e boleto com alta aprovação no Brasil.",
    color: "#00B1EA",
    tag: "MP",
    credentialFields: [
      {
        key: "access_token",
        label: "Access Token",
        secret: true,
        hint: "Disponível em Suas integrações › Credenciais de produção.",
      },
      { key: "public_key", label: "Public Key", secret: false },
    ],
    methods: ["pix", "card", "boleto"],
    environments: ["sandbox", "production"],
    live: true,
    oauth: true,
  },
  {
    id: "asaas",
    name: "Asaas",
    category: "Pagamentos",
    kind: "payment",
    desc: "Pix e boleto com a sua conta Asaas.",
    color: "#1E3A8A",
    tag: "AS",
    credentialFields: [
      {
        key: "api_key",
        label: "Chave de API",
        secret: true,
        hint: "No Asaas: menu do usuário › Integrações › Chaves de API › Gerar chave.",
      },
    ],
    methods: ["pix", "boleto"],
    environments: ["sandbox", "production"],
    live: true,
    autoWebhook: true,
  },
  {
    id: "pagarme",
    name: "Pagar.me",
    category: "Pagamentos",
    kind: "payment",
    desc: "Gateway brasileiro com split de pagamentos.",
    color: "#65A300",
    tag: "PG",
    credentialFields: [
      { key: "secret_key", label: "Secret Key", secret: true },
      { key: "public_key", label: "Public Key", secret: false },
    ],
    methods: ["pix", "card", "boleto"],
    environments: ["sandbox", "production"],
    live: false,
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Pagamentos",
    kind: "payment",
    desc: "Receba com cartão internacional e assinaturas.",
    color: "#635BFF",
    tag: "ST",
    credentialFields: [
      { key: "secret_key", label: "Secret Key", secret: true },
      { key: "publishable_key", label: "Publishable Key", secret: false },
    ],
    methods: ["card", "pix", "boleto"],
    environments: ["sandbox", "production"],
    live: false,
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "E-commerce",
    kind: "ecommerce",
    desc: "Sincronize produtos e pedidos da sua loja.",
    color: "#95BF47",
    tag: "SH",
    credentialFields: [],
    methods: [],
    environments: [],
    live: false,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "E-commerce",
    kind: "ecommerce",
    desc: "Conecte sua loja WordPress ao checkout PAVOX.",
    color: "#7F54B3",
    tag: "WC",
    credentialFields: [],
    methods: [],
    environments: [],
    live: false,
  },
];

export function getProvider(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function getPaymentProvider(id: string): ProviderDef | undefined {
  const provider = getProvider(id);
  return provider && provider.kind === "payment" ? provider : undefined;
}

/** Turn a raw credential value into a safe, non-reversible display hint. */
export function maskValue(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (v.length <= 4) return "••••";
  return `•••• ${v.slice(-4)}`;
}

export function maskCredentials(
  provider: ProviderDef,
  credentials: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of provider.credentialFields) {
    const value = credentials[field.key];
    if (value) out[field.key] = maskValue(value);
  }
  return out;
}

// Single place where a provider id becomes an adapter.
import { AppmaxGateway, webhookOrderId as appmaxWebhookId, type AppmaxCredentials } from "./appmax.ts";
import { AsaasGateway, asaasSplitFee, type AsaasCredentials } from "./asaas.ts";
import { GaruGateway, webhookChargeId as garuWebhookId, type GaruCredentials, type ProductRefStore } from "./garu.ts";
import {
  HOPYSPLIT_SANDBOX_URL,
  HopySplitGateway,
  postbackTransactionId,
  type HopySplitBrand,
  type HopySplitCredentials,
} from "./hopysplit.ts";
import { MercadoPagoGateway, type MercadoPagoCredentials } from "./mercadopago.ts";
import { splitFee as mercadoPagoSplitFee } from "./mercadopago-oauth.ts";
import type { PaymentGateway } from "./types.ts";

/** A connection step failed for a reason the merchant can fix (shown as is). */
export class SetupError extends Error {}

export type ConnectContext = {
  webhookUrl: string;
  /** Merchant e-mail (Asaas notifies it if the webhook starts failing). */
  email: string;
  methods: string[];
};

/** Server-side helpers some adapters need (e.g. Garu's mirror products). */
export type GatewayDeps = { products?: ProductRefStore };

export type ProviderSpec = {
  /** Name shown to the merchant ("O Asaas recusou o reembolso…"). */
  displayName: string;
  /** Credential keys typed by the merchant; all must be present. */
  requiredCredentials: string[];
  /** Methods this adapter can actually charge. */
  methods: string[];
  create: (
    credentials: Record<string, string>,
    environment: "sandbox" | "production",
    deps?: GatewayDeps,
  ) => PaymentGateway;
  /**
   * Generic webhook (`gateway-webhook?provider=…&store=…`): how to find the
   * charge id in the notification. Omitted for gateways with their own function.
   */
  webhookPaymentId?: (body: Record<string, unknown>) => string | null;
  /** PAVOX fee retained by the gateway itself (split), or null → billed later. */
  splitFee: (credentials: Record<string, string>, fee: number) => number | null;
  /**
   * Runs after the credentials are verified, before saving. Returns extra
   * server-side credentials to store (e.g. the webhook token). Throws
   * SetupError with a message for the merchant.
   */
  onConnect?: (
    credentials: Record<string, string>,
    environment: "sandbox" | "production",
    ctx: ConnectContext,
  ) => Promise<Record<string, string>>;
};

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const noSplit = () => null;

function hopySplit(brand: HopySplitBrand): ProviderSpec {
  return {
    displayName: brand.name,
    requiredCredentials: ["secret_key"],
    methods: ["pix", "boleto"],
    create: (credentials, environment) =>
      new HopySplitGateway(brand, credentials as unknown as HopySplitCredentials, environment),
    webhookPaymentId: postbackTransactionId,
    splitFee: noSplit,
  };
}

const PROVIDERS: Record<string, ProviderSpec> = {
  mercadopago: {
    displayName: "Mercado Pago",
    requiredCredentials: ["access_token", "public_key"],
    methods: ["pix", "card", "boleto"],
    create: (credentials, environment) =>
      new MercadoPagoGateway(credentials as unknown as MercadoPagoCredentials, environment),
    splitFee: mercadoPagoSplitFee,
  },
  asaas: {
    displayName: "Asaas",
    requiredCredentials: ["api_key"],
    methods: ["pix", "boleto"],
    create: (credentials, environment) => new AsaasGateway(credentials as unknown as AsaasCredentials, environment),
    splitFee: asaasSplitFee,
    onConnect: async (credentials, environment, ctx) => {
      const gateway = new AsaasGateway(credentials as unknown as AsaasCredentials, environment);
      if (ctx.methods.includes("pix") && (await gateway.hasPixKey()) === false) {
        throw new SetupError("Cadastre uma chave Pix na sua conta Asaas antes de ativar o Pix.");
      }
      const webhookToken = randomToken();
      try {
        await gateway.ensureWebhook(ctx.webhookUrl, ctx.email, webhookToken);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new SetupError(`Não foi possível configurar o aviso de pagamento (webhook) no Asaas: ${detail}`);
      }
      const walletId = await gateway.walletId();
      return { webhook_token: webhookToken, ...(walletId ? { wallet_id: walletId } : {}) };
    },
  },
};

// Brands of the HopySplit white-label platform (same API, own host). Each one
// was confirmed by its API answering exactly like HopySplit's.
const HOPYSPLIT_BRANDS: Record<string, HopySplitBrand> = {
  beehive: { name: "Beehive", productionUrl: "https://api.conta.paybeehive.com.br/v1", sandboxUrl: HOPYSPLIT_SANDBOX_URL },
  axionpay: { name: "Axion Pay", productionUrl: "https://api.conta.axionpay.com.br/v1", sandboxUrl: HOPYSPLIT_SANDBOX_URL },
  pagou: { name: "Pagou", productionUrl: "https://api.conta.pagou.ai/v1", sandboxUrl: HOPYSPLIT_SANDBOX_URL },
  credwave: { name: "CredWave", productionUrl: "https://api.credwavesolucoes.com.br/v1", sandboxUrl: HOPYSPLIT_SANDBOX_URL },
  // Platform sandbox only, for tests with a HopySplit test key.
  hopysplit: { name: "HopySplit", productionUrl: HOPYSPLIT_SANDBOX_URL, sandboxUrl: HOPYSPLIT_SANDBOX_URL },
};
for (const [id, brand] of Object.entries(HOPYSPLIT_BRANDS)) PROVIDERS[id] = hopySplit(brand);

PROVIDERS["appmax"] = {
  displayName: "Appmax",
  requiredCredentials: ["access_token"],
  methods: ["pix", "boleto"],
  create: (credentials, environment) => new AppmaxGateway(credentials as unknown as AppmaxCredentials, environment),
  webhookPaymentId: appmaxWebhookId,
  splitFee: noSplit,
};

PROVIDERS["garu"] = {
  displayName: "Garu",
  requiredCredentials: ["api_key"],
  methods: ["pix", "boleto"],
  create: (credentials, environment, deps) =>
    new GaruGateway(credentials as unknown as GaruCredentials, environment, deps?.products),
  webhookPaymentId: garuWebhookId,
  splitFee: noSplit,
};

export function providerSpec(provider: string): ProviderSpec | undefined {
  return PROVIDERS[provider];
}

export function gatewayFor(
  provider: string,
  credentials: Record<string, string>,
  environment: string,
  deps?: GatewayDeps,
): PaymentGateway | undefined {
  return PROVIDERS[provider]?.create(credentials, environment === "production" ? "production" : "sandbox", deps);
}

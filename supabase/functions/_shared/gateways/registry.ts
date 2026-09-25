// Single place where a provider id becomes an adapter.
import { MercadoPagoGateway, type MercadoPagoCredentials } from "./mercadopago.ts";
import type { PaymentGateway } from "./types.ts";

export type ProviderSpec = {
  /** Credential keys that must be present. */
  requiredCredentials: string[];
  /** Methods this adapter can actually charge. */
  methods: string[];
  create: (credentials: Record<string, string>, environment: "sandbox" | "production") => PaymentGateway;
};

const PROVIDERS: Record<string, ProviderSpec> = {
  mercadopago: {
    requiredCredentials: ["access_token", "public_key"],
    methods: ["pix"],
    create: (credentials, environment) =>
      new MercadoPagoGateway(credentials as unknown as MercadoPagoCredentials, environment),
  },
};

export function providerSpec(provider: string): ProviderSpec | undefined {
  return PROVIDERS[provider];
}

export function gatewayFor(
  provider: string,
  credentials: Record<string, string>,
  environment: string,
): PaymentGateway | undefined {
  return PROVIDERS[provider]?.create(credentials, environment === "production" ? "production" : "sandbox");
}

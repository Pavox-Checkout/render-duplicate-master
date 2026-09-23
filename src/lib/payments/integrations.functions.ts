// Server functions for the payment-integrations module.
//
// Security model:
// - Every function is guarded by `requireSupabaseAuth`, which resolves the
//   caller's `userId` from a verified bearer token (multi-tenant enforced on
//   the server, not the frontend).
// - Reads/writes use the service-role admin client, dynamically imported inside
//   the handler so it never ships to the client bundle.
// - Raw secrets are NEVER selected into a client-facing DTO; only masked hints
//   leave the server.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getPaymentProvider,
  maskCredentials,
  type Environment,
  type IntegrationStatus,
  type JsonValue,
  type PaymentMethod,
  type SavedIntegration,
} from "./catalog";

// Explicitly excludes the raw `credentials` column.
const SAFE_COLUMNS =
  "id, provider, environment, status, enabled_payment_methods, credentials_masked, routing, last_tested_at, last_test_status, created_at, updated_at";

type SafeRow = {
  id: string;
  provider: string;
  environment: string;
  status: string;
  enabled_payment_methods: string[] | null;
  credentials_masked: Record<string, string> | null;
  routing: Record<string, JsonValue> | null;
  last_tested_at: string | null;
  last_test_status: string | null;
  created_at: string;
  updated_at: string;
};

function toDTO(row: SafeRow): SavedIntegration {
  return {
    id: row.id,
    provider: row.provider,
    environment: row.environment as Environment,
    status: row.status as IntegrationStatus,
    enabledMethods: (row.enabled_payment_methods ?? []) as PaymentMethod[],
    maskedCredentials: row.credentials_masked ?? {},
    routing: row.routing ?? {},
    lastTestedAt: row.last_tested_at,
    lastTestStatus: row.last_test_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payment_integrations")
      .select(SAFE_COLUMNS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as unknown as SafeRow[]).map(toDTO);
  });

type SaveInput = {
  provider: string;
  environment: Environment;
  methods: PaymentMethod[];
  credentials: Record<string, string>;
};

export const saveIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SaveInput) => data)
  .handler(async ({ data, context }) => {
    const provider = getPaymentProvider(data.provider);
    if (!provider) throw new Error("Provedor de pagamento inválido.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load the existing row (if any) so secrets left blank on edit are kept.
    const { data: existing } = await supabaseAdmin
      .from("payment_integrations")
      .select("credentials")
      .eq("user_id", context.userId)
      .eq("provider", provider.id)
      .maybeSingle();

    const prev = ((existing?.credentials as Record<string, string>) ?? {});

    const credentials: Record<string, string> = {};
    for (const field of provider.credentialFields) {
      const incoming = (data.credentials?.[field.key] ?? "").trim();
      const value = incoming || prev[field.key] || "";
      if (!value) throw new Error(`Preencha o campo "${field.label}".`);
      credentials[field.key] = value;
    }

    const methods = data.methods.filter((m) => provider.methods.includes(m));
    if (methods.length === 0) throw new Error("Selecione ao menos um método de pagamento.");

    const now = new Date().toISOString();
    const payload = {
      user_id: context.userId,
      provider: provider.id,
      environment: data.environment,
      status: "connected",
      enabled_payment_methods: methods,
      credentials,
      credentials_masked: maskCredentials(provider, credentials),
      updated_at: now,
    };

    const { data: saved, error } = await supabaseAdmin
      .from("payment_integrations")
      .upsert(payload, { onConflict: "user_id,provider" })
      .select(SAFE_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return toDTO(saved as unknown as SafeRow);
  });

export const setIntegrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "connected" | "disabled" }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // History (orders, fees) is never deleted — only the integration status changes.
    const { data: saved, error } = await supabaseAdmin
      .from("payment_integrations")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select(SAFE_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return toDTO(saved as unknown as SafeRow);
  });

export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payment_integrations")
      .select("credentials")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error) throw new Error(error.message);

    const hasCredentials =
      !!row?.credentials && Object.keys(row.credentials as Record<string, unknown>).length > 0;

    // No real gateway API is called yet — that is the next phase. We only report
    // whether the stored configuration is complete, never a fake "success".
    const result: "pending" | "incomplete" = hasCredentials ? "pending" : "incomplete";
    await supabaseAdmin
      .from("payment_integrations")
      .update({ last_tested_at: new Date().toISOString(), last_test_status: result })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    return {
      result,
      message:
        result === "incomplete"
          ? "Credenciais incompletas. Edite a configuração antes de testar."
          : "Configuração válida. A verificação real com a API do gateway será ativada na próxima etapa.",
    };
  });

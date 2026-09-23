// Data layer for the Integrações module.
//
// Follows the same infrastructure as the rest of the app (products, checkouts):
// the browser Supabase client talks to Postgres directly and Row Level Security
// isolates each account's rows. No server function / service role is required.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getPaymentProvider,
  maskCredentials,
  type Environment,
  type IntegrationStatus,
  type JsonValue,
  type PaymentMethod,
  type SavedIntegration,
} from "./catalog";

const QUERY_KEY = ["payment-integrations"] as const;

// Columns safe to read for listing/display — deliberately excludes the raw
// `credentials` column so secrets do not flow into client state by default.
const SAFE_FIELDS =
  "id, provider, environment, status, enabled_payment_methods, credentials_masked, routing, last_tested_at, last_test_status, created_at, updated_at";

type IntegrationRow = {
  id: string;
  provider: string;
  environment: string;
  status: string;
  enabled_payment_methods: string[] | null;
  credentials_masked: Record<string, JsonValue> | null;
  routing: Record<string, JsonValue> | null;
  last_tested_at: string | null;
  last_test_status: string | null;
  created_at: string;
  updated_at: string;
};

const VALID_METHODS: PaymentMethod[] = ["pix", "card", "boleto"];
const VALID_STATUS: IntegrationStatus[] = ["not_connected", "connected", "disabled", "error"];

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function mapRow(row: IntegrationRow): SavedIntegration {
  return {
    id: row.id,
    provider: row.provider,
    environment: (row.environment === "production" ? "production" : "sandbox") as Environment,
    status: (VALID_STATUS.includes(row.status as IntegrationStatus)
      ? row.status
      : "connected") as IntegrationStatus,
    enabledMethods: (row.enabled_payment_methods ?? []).filter((m): m is PaymentMethod =>
      VALID_METHODS.includes(m as PaymentMethod),
    ),
    maskedCredentials: toStringRecord(row.credentials_masked),
    routing: (row.routing ?? {}) as Record<string, JsonValue>,
    lastTestedAt: row.last_tested_at,
    lastTestStatus: row.last_test_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada. Faça login novamente.");
  return data.user.id;
}

export function useIntegrations() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<SavedIntegration[]> => {
      const { data, error } = await supabase
        .from("payment_integrations")
        .select(SAFE_FIELDS)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as IntegrationRow[]).map(mapRow);
    },
  });
}

export function useSaveIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      provider: string;
      environment: Environment;
      methods: PaymentMethod[];
      credentials: Record<string, string>;
    }): Promise<SavedIntegration> => {
      const provider = getPaymentProvider(input.provider);
      if (!provider) throw new Error("Gateway inválido.");

      const userId = await requireUserId();

      // Merge with any previously stored secrets so a blank field on edit keeps
      // the existing value. Reading the owner's own credentials is allowed by RLS.
      const { data: existing, error: readError } = await supabase
        .from("payment_integrations")
        .select("credentials")
        .eq("user_id", userId)
        .eq("provider", provider.id)
        .maybeSingle();
      if (readError) throw new Error(readError.message);

      const previous = toStringRecord(
        (existing as { credentials?: Record<string, JsonValue> } | null)?.credentials,
      );

      const merged: Record<string, string> = {};
      for (const field of provider.credentialFields) {
        const typed = (input.credentials[field.key] ?? "").trim();
        const value = typed || previous[field.key] || "";
        if (!value) throw new Error(`Informe o campo "${field.label}".`);
        merged[field.key] = value;
      }

      const methods = input.methods.filter((m) => provider.methods.includes(m));
      if (methods.length === 0) throw new Error("Selecione ao menos um método de pagamento.");

      const environment: Environment = provider.environments.includes(input.environment)
        ? input.environment
        : (provider.environments[0] ?? "sandbox");

      const { data, error } = await supabase
        .from("payment_integrations")
        .upsert(
          {
            user_id: userId,
            provider: provider.id,
            environment,
            status: "connected",
            enabled_payment_methods: methods,
            credentials: merged,
            credentials_masked: maskCredentials(provider, merged),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" },
        )
        .select(SAFE_FIELDS)
        .single();
      if (error) throw new Error(error.message);
      return mapRow(data as IntegrationRow);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useSetIntegrationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: "connected" | "disabled";
    }): Promise<SavedIntegration> => {
      const { data, error } = await supabase
        .from("payment_integrations")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .select(SAFE_FIELDS)
        .single();
      if (error) throw new Error(error.message);
      return mapRow(data as IntegrationRow);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useTestIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
    }): Promise<{ result: "ok" | "incomplete"; message: string }> => {
      // Read the stored credentials (owner-only via RLS) to check completeness.
      const { data: row, error: readError } = await supabase
        .from("payment_integrations")
        .select("provider, credentials")
        .eq("id", input.id)
        .single();
      if (readError) throw new Error(readError.message);

      const provider = getPaymentProvider((row as { provider: string }).provider);
      const credentials = toStringRecord(
        (row as { credentials?: Record<string, JsonValue> }).credentials,
      );

      const missing = provider
        ? provider.credentialFields.filter((f) => !(credentials[f.key] ?? "").trim())
        : [];

      const result: "ok" | "incomplete" = missing.length === 0 ? "ok" : "incomplete";
      const message =
        result === "ok"
          ? "Credenciais presentes. A verificação real com a API do gateway será ativada na próxima etapa."
          : `Faltam credenciais: ${missing.map((f) => f.label).join(", ")}.`;

      const { error: updateError } = await supabase
        .from("payment_integrations")
        .update({ last_tested_at: new Date().toISOString(), last_test_status: result })
        .eq("id", input.id);
      if (updateError) throw new Error(updateError.message);

      return { result, message };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

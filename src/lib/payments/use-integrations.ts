// Data layer for the Integrações module.
//
// Follows the same infrastructure as the rest of the app (products, checkouts):
// the browser Supabase client talks to Postgres directly and Row Level Security
// isolates each account's rows. No server function / service role is required.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  type Environment,
  type IntegrationStatus,
  type JsonValue,
  type PaymentMethod,
  type SavedIntegration,
} from "./catalog";

const QUERY_KEY = ["payment-integrations"] as const;

// Columns the browser may read. Secrets live in Supabase Vault and are only
// reachable by the backend (Edge Function `integrations`).
const SAFE_FIELDS =
  "id, provider, environment, status, enabled_payment_methods, credentials_masked, routing, last_tested_at, last_test_status, account_label, created_at, updated_at";

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
  account_label?: string | null;
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
    accountLabel: row.account_label ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

async function invokeIntegrations<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("integrations", { body });
  if (error) {
    let message = "Não foi possível falar com o servidor. Tente novamente.";
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = (await error.context.json()) as { message?: string };
        if (payload?.message) message = payload.message;
      } catch {
        // keep the generic message
      }
    }
    throw new Error(message);
  }
  return data as T;
}

/** Public URL the merchant registers as the gateway webhook. */
export function integrationWebhookUrl(provider: string, userId: string) {
  const base = import.meta.env["VITE_SUPABASE_URL"] as string;
  return `${base}/functions/v1/${provider}-webhook?store=${userId}`;
}

export function useSaveIntegration() {
  const qc = useQueryClient();
  return useMutation({
    // Credentials go to the backend, which validates them against the gateway
    // and stores them encrypted. They are never read back by the browser.
    mutationFn: async (input: {
      provider: string;
      environment: Environment;
      methods: PaymentMethod[];
      credentials: Record<string, string>;
    }): Promise<SavedIntegration> => {
      const result = await invokeIntegrations<{ integration: IntegrationRow }>({ action: "save", ...input });
      return mapRow(result.integration);
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
      provider: string;
    }): Promise<{ result: string; message: string }> =>
      invokeIntegrations<{ result: string; message: string }>({ action: "test", provider: input.provider }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

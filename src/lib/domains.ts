// Real custom domains. Reads come from Supabase (RLS: own rows); anything that
// touches Vercel (add / verify / remove) goes through the `domains` Edge Function.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type DomainStatus = "pending_dns" | "verifying" | "active" | "error";

export type DnsRecord = {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  purpose: "routing" | "ownership";
};

export type Domain = {
  id: string;
  hostname: string;
  checkout_id: string | null;
  is_primary: boolean;
  status: DomainStatus;
  dns_records: DnsRecord[];
  last_error: string | null;
  last_checked_at: string | null;
  verified_at: string | null;
  created_at: string;
};

export const DOMAIN_STATUS: Record<
  DomainStatus,
  { label: string; tone: "success" | "warning" | "neutral" | "error"; pulse?: boolean }
> = {
  active: { label: "Conectado", tone: "success" },
  pending_dns: { label: "Aguardando DNS", tone: "neutral" },
  verifying: { label: "Verificando", tone: "warning", pulse: true },
  error: { label: "Erro na verificação", tone: "error" },
};

/** Mirrors pavox_domain_limit() in the database (the database enforces it). */
export const PLAN_DOMAIN_LIMITS: Record<string, number> = { free: 1, growth: 3, pro: 5 };

const QUERY_KEY = ["domains"] as const;

async function invokeDomains<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("domains", { body });
  if (error) {
    let message = "Não foi possível falar com o servidor. Tente novamente.";
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = (await error.context.json()) as { message?: string };
        if (payload?.message) message = payload.message;
      } catch {
        // keep generic message
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export function useDomains() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Domain[]> => {
      const { data, error } = await supabase
        .from("domains")
        .select(
          "id, hostname, checkout_id, is_primary, status, dns_records, last_error, last_checked_at, verified_at, created_at",
        )
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Domain[];
    },
  });
}

function useDomainMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useAddDomain() {
  return useDomainMutation((input: { hostname: string; checkoutId: string | null }) =>
    invokeDomains<{ domain: Domain }>({
      action: "add",
      hostname: input.hostname,
      checkoutId: input.checkoutId,
    }).then((r) => r.domain),
  );
}

export function useVerifyDomain() {
  return useDomainMutation((domainId: string) =>
    invokeDomains<{ domain: Domain }>({ action: "verify", domainId }).then((r) => r.domain),
  );
}

export function useRemoveDomain() {
  return useDomainMutation((domainId: string) => invokeDomains({ action: "remove", domainId }));
}

export function useSetDomainCheckout() {
  return useDomainMutation(async (input: { domainId: string; checkoutId: string | null }) => {
    const { error } = await supabase.rpc("set_domain_checkout", {
      p_domain_id: input.domainId,
      p_checkout_id: input.checkoutId as string,
    });
    if (error) throw new Error("Não foi possível trocar o checkout do domínio.");
  });
}

export function useSetPrimaryDomain() {
  return useDomainMutation(async (domainId: string) => {
    const { error } = await supabase.rpc("set_primary_domain", { p_domain_id: domainId });
    if (error) throw new Error("Não foi possível definir o domínio principal.");
  });
}

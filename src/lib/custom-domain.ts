import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";

export type DomainTarget = { store: string; checkout: string };

// Hosts that serve the PAVOX platform itself (landing, dashboard, previews).
const PLATFORM_SUFFIXES = [".vercel.app", ".lovable.app", ".lovableproject.com"];

export function isPlatformHost(host: string) {
  return (
    !host ||
    host === "localhost" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    PLATFORM_SUFFIXES.some((suffix) => host.endsWith(suffix))
  );
}

/** Hostname of the incoming request (custom domains arrive through Vercel). */
const getRequestHostname = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequest().headers;
  const raw = headers.get("x-forwarded-host") ?? headers.get("host") ?? "";
  return raw.split(",")[0]!.trim().toLowerCase().replace(/:\d+$/, "");
});

/**
 * Checkout that a merchant's custom domain points to, or null on PAVOX's own
 * hosts / unknown domains. Never throws: the landing page is the fallback.
 */
export async function resolveCustomDomain(): Promise<DomainTarget | null> {
  try {
    const host =
      typeof window !== "undefined" ? window.location.hostname : await getRequestHostname();
    if (isPlatformHost(host)) return null;
    const { data, error } = await supabase.rpc("get_domain_checkout", { p_host: host });
    if (error || !data) return null;
    return data as unknown as DomainTarget;
  } catch {
    return null;
  }
}

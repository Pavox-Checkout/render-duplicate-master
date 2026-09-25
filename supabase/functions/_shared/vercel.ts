// Vercel Domains API — attaches merchant domains to the PAVOX project.
// Docs: POST /v10/projects/{id}/domains, GET /v9/projects/{id}/domains/{d},
// POST /v9/projects/{id}/domains/{d}/verify, GET /v6/domains/{d}/config,
// DELETE /v9/projects/{id}/domains/{d}.

const API = "https://api.vercel.com";
const TIMEOUT_MS = 15_000;

export type DnsRecord = { type: "A" | "CNAME" | "TXT"; name: string; value: string; purpose: "routing" | "ownership" };

export type DomainCheck = {
  verified: boolean;
  misconfigured: boolean;
  records: DnsRecord[];
};

export class VercelError extends Error {
  constructor(
    public code: "not_configured" | "domain_in_use" | "invalid_domain" | "unauthorized" | "unavailable" | "unknown",
    message: string,
    public httpStatus?: number,
  ) {
    super(message);
  }
}

type ProjectDomain = {
  name?: string;
  apexName?: string;
  verified?: boolean;
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>;
  error?: { code?: string; message?: string };
};

type DomainConfig = {
  misconfigured?: boolean;
  recommendedCNAME?: Array<{ rank?: number; value?: string }>;
  recommendedIPv4?: Array<{ rank?: number; value?: string[] }>;
};

function settings() {
  const token = Deno.env.get("VERCEL_TOKEN");
  if (!token) throw new VercelError("not_configured", "VERCEL_TOKEN não configurado.");
  return {
    token,
    project: Deno.env.get("VERCEL_PROJECT_ID") ?? "prj_zI56GqfIZPUHeBpYfjkUsSr8ZKw1",
    teamId: Deno.env.get("VERCEL_TEAM_ID") ?? "team_d09b11urrqr1NHs3v4xBAPom",
  };
}

async function call(path: string, init: RequestInit = {}): Promise<{ status: number; body: Record<string, unknown> }> {
  const { token, teamId } = settings();
  const sep = path.includes("?") ? "&" : "?";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${path}${sep}teamId=${teamId}`, {
      ...init,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 401 || res.status === 403) {
      throw new VercelError("unauthorized", "Token da Vercel sem permissão para este projeto.", res.status);
    }
    if (res.status >= 500) throw new VercelError("unavailable", "A Vercel não respondeu.", res.status);
    return { status: res.status, body };
  } catch (err) {
    if (err instanceof VercelError) throw err;
    throw new VercelError("unavailable", "A Vercel não respondeu.");
  } finally {
    clearTimeout(timer);
  }
}

function routingRecord(domain: ProjectDomain, config: DomainConfig): DnsRecord {
  const name = domain.name ?? "";
  const apex = domain.apexName ?? name;
  if (name === apex) {
    const ip = [...(config.recommendedIPv4 ?? [])].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0]?.value?.[0];
    return { type: "A", name: "@", value: ip ?? "76.76.21.21", purpose: "routing" };
  }
  const cname = [...(config.recommendedCNAME ?? [])].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0]?.value;
  return {
    type: "CNAME",
    name: name.slice(0, -(apex.length + 1)),
    value: (cname ?? "cname.vercel-dns.com").replace(/\.$/, ""),
    purpose: "routing",
  };
}

function ownershipRecords(domain: ProjectDomain): DnsRecord[] {
  return (domain.verification ?? [])
    .filter((v) => v.type === "TXT")
    .map((v) => ({ type: "TXT" as const, name: v.domain, value: v.value, purpose: "ownership" as const }));
}

export async function addDomain(hostname: string): Promise<void> {
  const { project } = settings();
  const { status, body } = await call(`/v10/projects/${project}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: hostname }),
  });
  if (status < 300) return;
  const error = (body["error"] ?? {}) as { code?: string; message?: string };
  if (error.code === "domain_already_in_use" || status === 409) {
    throw new VercelError("domain_in_use", "Este domínio já está em uso em outro site da Vercel.", status);
  }
  if (error.code === "domain_already_exists") return; // already attached to this project
  if (error.code === "invalid_domain" || status === 400) {
    throw new VercelError("invalid_domain", error.message ?? "Domínio inválido.", status);
  }
  throw new VercelError("unknown", error.message ?? `HTTP ${status}`, status);
}

/** Re-checks ownership + DNS. Vercel issues the HTTPS certificate on its own once DNS is right. */
export async function checkDomain(hostname: string): Promise<DomainCheck> {
  const { project } = settings();
  let domain = (await call(`/v9/projects/${project}/domains/${hostname}`)).body as ProjectDomain;
  if (domain.verified === false) {
    const verify = await call(`/v9/projects/${project}/domains/${hostname}/verify`, { method: "POST" });
    if (verify.status < 300) domain = { ...domain, ...(verify.body as ProjectDomain) };
  }
  const config = (await call(`/v6/domains/${hostname}/config?projectIdOrName=${project}`)).body as DomainConfig;
  const records = [routingRecord(domain, config), ...(domain.verified ? [] : ownershipRecords(domain))];
  return { verified: domain.verified === true, misconfigured: config.misconfigured !== false, records };
}

export async function removeDomain(hostname: string): Promise<void> {
  const { project } = settings();
  const { status } = await call(`/v9/projects/${project}/domains/${hostname}`, { method: "DELETE" });
  if (status >= 300 && status !== 404) throw new VercelError("unknown", `HTTP ${status}`, status);
}

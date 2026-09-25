// Normalizes what a merchant types ("https://Checkout.Loja.com.br/") into a
// bare hostname, rejecting hosts that cannot be a merchant's own domain.
const HOST_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const BLOCKED_SUFFIXES = [".vercel.app", ".lovable.app", ".lovableproject.com", ".supabase.co", ".vercel.sh"];

export function normalizeHostname(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .split("/")[0]!
    .split("?")[0]!
    .split(":")[0]!
    .replace(/\.$/, "");
  if (host.length > 253 || !HOST_RE.test(host)) return null;
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) return null;
  return host;
}

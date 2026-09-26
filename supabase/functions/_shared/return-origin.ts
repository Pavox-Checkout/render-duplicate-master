// Where the PAVOX dashboard may be running, so OAuth callbacks only ever send
// the merchant back to PAVOX itself (never to an arbitrary site).
const DEFAULT_ORIGINS = [
  "https://pavox-checkout-zeta.vercel.app",
  "https://render-duplicate-master.vercel.app",
];

export function isAllowedReturnOrigin(origin: string): boolean {
  if (!origin) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.origin !== origin) return false;
  if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return true;
  if (url.protocol !== "https:") return false;

  const extra = (Deno.env.get("PAVOX_APP_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if ([...DEFAULT_ORIGINS, ...extra].includes(origin)) return true;
  // Lovable editor previews of this project.
  return url.hostname.endsWith(".lovable.app") || url.hostname.endsWith(".lovableproject.com");
}

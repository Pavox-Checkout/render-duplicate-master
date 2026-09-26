// Mercado Pago OAuth ("Conectar com Mercado Pago").
//
// The merchant authorizes the PAVOX application on Mercado Pago's own site; we
// receive an access token scoped to that seller. Orders created with it can
// carry `marketplace_fee`, which Mercado Pago retains for PAVOX (split).
//
// Secrets: MP_CLIENT_SECRET must be set as an Edge Function secret. The client
// id is public (it appears in the authorization URL).
import { GatewayError } from "./types.ts";

const API = "https://api.mercadopago.com";
const AUTH_URL = "https://auth.mercadopago.com.br/authorization";
const TIMEOUT_MS = 15_000;

/** PAVOX application on Mercado Pago (App ID = client id). */
const DEFAULT_CLIENT_ID = "751778378668882";
/** Mercado Pago user that owns the PAVOX application (receives marketplace_fee). */
const DEFAULT_MARKETPLACE_USER_ID = "3662516384";

/** Refresh when the token has less than this left (tokens last 180 days). */
export const REFRESH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type OAuthConfig = { clientId: string; clientSecret: string; redirectUri: string };

export function oauthConfig(): OAuthConfig | null {
  const clientSecret = Deno.env.get("MP_CLIENT_SECRET") ?? "";
  if (!clientSecret) return null;
  return {
    clientId: Deno.env.get("MP_CLIENT_ID") || DEFAULT_CLIENT_ID,
    clientSecret,
    redirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-oauth`,
  };
}

export function marketplaceUserId(): string {
  return Deno.env.get("MP_MARKETPLACE_USER_ID") || DEFAULT_MARKETPLACE_USER_ID;
}

export function authorizationUrl(config: OAuthConfig, state: string): string {
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", config.redirectUri);
  return url.toString();
}

export type OAuthTokens = {
  access_token: string;
  public_key: string;
  refresh_token: string;
  user_id: string;
  live_mode: boolean;
  expires_at: string;
};

type TokenResponse = {
  access_token?: string;
  public_key?: string;
  refresh_token?: string;
  user_id?: number | string;
  live_mode?: boolean;
  expires_in?: number;
  message?: string;
  error?: string;
};

async function tokenRequest(body: Record<string, string>, now: number): Promise<OAuthTokens> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API}/oauth/token`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GatewayError("gateway_unavailable", "Mercado Pago não respondeu.");
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !data.access_token || !data.refresh_token || !data.user_id) {
    const detail = data.message ?? data.error ?? `HTTP ${res.status}`;
    if (res.status >= 500) throw new GatewayError("gateway_unavailable", detail, res.status);
    throw new GatewayError("invalid_credentials", detail, res.status);
  }
  return {
    access_token: data.access_token,
    public_key: data.public_key ?? "",
    refresh_token: data.refresh_token,
    user_id: String(data.user_id),
    live_mode: data.live_mode !== false,
    expires_at: new Date(now + (data.expires_in ?? 15_552_000) * 1000).toISOString(),
  };
}

export function exchangeCode(config: OAuthConfig, code: string, now = Date.now()): Promise<OAuthTokens> {
  return tokenRequest(
    {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    },
    now,
  );
}

export function refreshTokens(config: OAuthConfig, refreshToken: string, now = Date.now()): Promise<OAuthTokens> {
  return tokenRequest(
    {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    now,
  );
}

/** Credentials stored in Vault for an OAuth connection. */
export function oauthCredentials(tokens: OAuthTokens): Record<string, string> {
  return {
    access_token: tokens.access_token,
    public_key: tokens.public_key,
    refresh_token: tokens.refresh_token,
    mp_user_id: tokens.user_id,
    expires_at: tokens.expires_at,
    oauth: "true",
  };
}

export function needsRefresh(credentials: Record<string, string>, now = Date.now()): boolean {
  if (credentials["oauth"] !== "true" || !credentials["refresh_token"]) return false;
  const expires = Date.parse(credentials["expires_at"] ?? "");
  return Number.isNaN(expires) || expires - now < REFRESH_WINDOW_MS;
}

/**
 * Fee sent as marketplace_fee, or null when the split does not apply: manual
 * (non-OAuth) credentials, the marketplace owner selling on its own account,
 * or a fee that rounds to zero.
 */
export function splitFee(credentials: Record<string, string>, fee: number): number | null {
  if (credentials["oauth"] !== "true") return null;
  if (credentials["mp_user_id"] === marketplaceUserId()) return null;
  if (!Number.isFinite(fee) || fee <= 0) return null;
  return Math.round(fee * 100) / 100;
}

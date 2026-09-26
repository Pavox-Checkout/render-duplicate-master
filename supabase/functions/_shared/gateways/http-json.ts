// Small JSON-over-HTTP helper shared by the newer gateway adapters.
import { GatewayError, type ConnectionStatus } from "./types.ts";

const TIMEOUT_MS = 15_000;

export function connectionStatusFor(httpStatus: number): ConnectionStatus {
  if (httpStatus === 401) return "invalid_credentials";
  if (httpStatus === 403) return "permission_error";
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus >= 500) return "gateway_unavailable";
  return "unknown_error";
}

export type JsonResponse<T> = { status: number; ok: boolean; data: T };

/** Fetch with timeout; network failures become `gateway_unavailable`. */
export async function requestJson<T = Record<string, unknown>>(
  gateway: string,
  url: string,
  init: RequestInit = {},
): Promise<JsonResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: controller.signal });
  } catch {
    throw new GatewayError("gateway_unavailable", `${gateway} não respondeu.`);
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, ok: res.ok, data };
}

/** Turns a failed response into a GatewayError with the gateway's own message. */
export function failure(status: number, detail: string): GatewayError {
  if (status === 401 || status === 403 || status === 429 || status >= 500) {
    return new GatewayError(connectionStatusFor(status), detail, status);
  }
  return new GatewayError("payment_rejected", detail, status);
}

/** First human-readable message in the usual error shapes. */
export function errorMessage(data: unknown, status: number): string {
  const d = (data ?? {}) as Record<string, unknown>;
  const errors = d["errors"];
  if (Array.isArray(errors) && errors.length) {
    const first = errors[0] as Record<string, unknown> | string;
    if (typeof first === "string") return first;
    const text = first["message"] ?? first["description"] ?? first["detail"];
    if (typeof text === "string") return text;
  }
  for (const key of ["message", "text", "error", "detail"]) {
    if (typeof d[key] === "string" && d[key]) return d[key] as string;
  }
  return `HTTP ${status}`;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  const first = parts.shift() ?? "";
  return { first, last: parts.join(" ") || first };
}

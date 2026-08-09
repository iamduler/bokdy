import { cookies } from "next/headers";
import {
  AUTH_PRESENT_COOKIE,
  ORG_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth";

export const GO_X_CLIENT = "admin";

export function goBaseUrl(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8088/api/v1"
  );
}

export async function readSessionTokens() {
  const store = await cookies();
  const accessToken = store.get(SESSION_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!accessToken && !refreshToken) return null;
  return {
    accessToken,
    refreshToken,
    organizationId: store.get(ORG_COOKIE)?.value,
  };
}

export async function setAuthCookiesOnStore(opts: {
  accessToken: string;
  refreshToken: string;
}) {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, opts.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 15 * 60,
  });
  store.set(REFRESH_COOKIE, opts.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  store.set(AUTH_PRESENT_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthCookiesOnStore() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(AUTH_PRESENT_COOKIE);
}

const ZERO_TRACE = "0".repeat(32);

function hex32(raw: string | null): string | null {
  if (!raw) return null;
  const hex = raw.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex) || hex === ZERO_TRACE) return null;
  return hex;
}

function randomHex(byteLen: number): string {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Headers to forward to Go, minting W3C traceparent + X-Trace-ID when omitted. */
export function goProxyHeaders(req: { headers: Headers }): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("Content-Type") ?? "application/json",
  };
  const acceptLanguage = req.headers.get("Accept-Language");
  if (acceptLanguage) {
    headers["Accept-Language"] = acceptLanguage;
  }
  const incomingTP = req.headers.get("traceparent");
  const incomingTS = req.headers.get("tracestate");
  let traceId = hex32(req.headers.get("X-Trace-ID"));
  let traceparent = incomingTP;
  if (!traceparent) {
    if (!traceId) traceId = randomHex(16);
    traceparent = `00-${traceId}-${randomHex(8)}-01`;
  } else if (!traceId) {
    const match = /^00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/i.exec(traceparent);
    if (match) traceId = match[1].toLowerCase();
  }
  headers.traceparent = traceparent;
  if (incomingTS) headers.tracestate = incomingTS;
  if (traceId) headers["X-Trace-ID"] = traceId;
  for (const name of ["X-Request-ID", "X-Correlation-ID"] as const) {
    const value = req.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

export function goClientResponseHeaders(res: Response, fallbackTrace?: string): Headers {
  const out = new Headers();
  out.set("Content-Type", res.headers.get("Content-Type") ?? "application/json");
  const trace = res.headers.get("X-Trace-ID") || fallbackTrace;
  if (trace) out.set("X-Trace-ID", trace);
  const traceparent = res.headers.get("traceparent");
  if (traceparent) out.set("traceparent", traceparent);
  const tracestate = res.headers.get("tracestate");
  if (tracestate) out.set("tracestate", tracestate);
  for (const name of ["X-Request-ID", "X-Correlation-ID"] as const) {
    const value = res.headers.get(name);
    if (value) out.set(name, value);
  }
  return out;
}

export async function proxyToGo(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const tokens = await readSessionTokens();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  if (tokens?.organizationId) {
    headers.set("X-Organization-ID", tokens.organizationId);
  }
  const url = `${goBaseUrl().replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  return fetch(url, { ...init, headers, cache: "no-store" });
}

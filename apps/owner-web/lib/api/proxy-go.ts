import { cookies } from "next/headers";
import {
  AUTH_PRESENT_COOKIE,
  ORG_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth";

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

import { apiErrorFromBody } from "@/lib/api/errors";

export type LoginInput = { email: string; password: string };
export type RegisterInput = { email: string; password: string; full_name?: string };

async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`/api/auth/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw apiErrorFromBody(json, res.status);
  }
  return json as T;
}

export function login(input: LoginInput) {
  return authRequest<{ data?: { access_token?: string } }>("login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterInput) {
  return authRequest("register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return authRequest<void>("logout", { method: "POST" });
}

export function getSession() {
  return authRequest<{ data?: unknown }>("session", { method: "GET" });
}

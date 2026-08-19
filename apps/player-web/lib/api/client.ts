import { apiErrorFromBody } from "@/lib/api/errors";

function acceptLanguage(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const lang = document.documentElement.lang?.trim();
  if (lang) return lang;
  const seg = window.location.pathname.split("/").filter(Boolean)[0];
  return seg === "en" || seg === "vi" ? seg : undefined;
}

/** Browser → Next `/api/go/*` → Go. Unwraps `{ data }`. Throws `ApiError`. */
export async function apiGo<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const locale = acceptLanguage();
  if (locale && !headers.has("Accept-Language")) {
    headers.set("Accept-Language", locale);
  }
  const res = await fetch(`/api/go/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => ({}))) as { data?: T };
  if (!res.ok) {
    throw apiErrorFromBody(json, res.status);
  }
  return (json.data ?? json) as T;
}

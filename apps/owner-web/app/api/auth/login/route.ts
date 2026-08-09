import { NextResponse } from "next/server";
import { GO_X_CLIENT, goBaseUrl, setAuthCookiesOnStore } from "@/lib/api/proxy-go";

export async function POST(req: Request) {
  const body = await req.text();
  const upstream = await fetch(`${goBaseUrl().replace(/\/$/, "")}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-Client": GO_X_CLIENT },
    body,
    cache: "no-store",
  });
  const text = await upstream.text();
  if (!upstream.ok) {
    return new NextResponse(text || upstream.statusText, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  }
  if (text) {
    try {
      const json = JSON.parse(text) as {
        data?: { access_token?: string; refresh_token?: string };
      };
      const access = json.data?.access_token;
      const refresh = json.data?.refresh_token;
      if (access && refresh) {
        await setAuthCookiesOnStore({ accessToken: access, refreshToken: refresh });
      }
    } catch {
      // ignore parse errors
    }
  }
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

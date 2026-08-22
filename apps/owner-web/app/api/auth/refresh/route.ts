import { NextResponse } from "next/server";
import {
  GO_X_CLIENT,
  goBaseUrl,
  readSessionTokens,
  setAuthCookiesOnStore,
} from "@/lib/api/proxy-go";

export async function POST(req: Request) {
  const rawBody = await req.text();
  let refreshToken: string | undefined;

  const cookieTokens = await readSessionTokens();
  if (cookieTokens?.refreshToken) {
    refreshToken = cookieTokens.refreshToken;
  } else if (rawBody) {
    try {
      const parsed = JSON.parse(rawBody) as { refresh_token?: string };
      refreshToken = parsed.refresh_token;
    } catch {
      // keep undefined
    }
  }

  if (!refreshToken) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "missing refresh token" },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${goBaseUrl().replace(/\/$/, "")}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Client": GO_X_CLIENT,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
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

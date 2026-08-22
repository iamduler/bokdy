import { NextResponse } from "next/server";
import {
  proxyToGoWithRefresh,
  readSessionTokens,
  refreshSessionFromCookie,
} from "@/lib/api/proxy-go";

export async function GET() {
  const tokens = await readSessionTokens();
  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json({ data: { authenticated: false } });
  }

  if (!tokens?.accessToken && tokens?.refreshToken) {
    const access = await refreshSessionFromCookie();
    if (!access) {
      return NextResponse.json({ data: { authenticated: false } }, { status: 401 });
    }
  }

  const res = await proxyToGoWithRefresh("identity/me");
  if (!res.ok) {
    return NextResponse.json({ data: { authenticated: false } }, { status: res.status });
  }
  const json = await res.json();
  return NextResponse.json(json);
}

import { NextResponse } from "next/server";
import { proxyToGo, readSessionTokens } from "@/lib/api/proxy-go";

export async function GET() {
  const tokens = await readSessionTokens();
  if (!tokens?.accessToken) {
    return NextResponse.json({ data: { authenticated: false } });
  }
  const res = await proxyToGo("identity/me");
  if (!res.ok) {
    return NextResponse.json({ data: { authenticated: false } }, { status: res.status });
  }
  const json = await res.json();
  return NextResponse.json(json);
}

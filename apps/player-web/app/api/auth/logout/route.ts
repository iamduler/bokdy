import { NextResponse } from "next/server";
import { GO_X_CLIENT, clearAuthCookiesOnStore, proxyToGo } from "@/lib/api/proxy-go";

export async function POST() {
  try {
    await proxyToGo("auth/logout", { method: "POST", headers: { "X-Client": GO_X_CLIENT } });
  } catch {
    // ignore upstream errors on logout
  }
  await clearAuthCookiesOnStore();
  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";
import { clearAuthCookiesOnStore, proxyToGo } from "@/lib/api/proxy-go";

export async function POST() {
  try {
    await proxyToGo("auth/logout", { method: "POST" });
  } catch {
    // ignore upstream errors on logout
  }
  await clearAuthCookiesOnStore();
  return new NextResponse(null, { status: 204 });
}

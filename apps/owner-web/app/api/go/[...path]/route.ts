import { NextRequest, NextResponse } from "next/server";
import { proxyToGo } from "@/lib/api/proxy-go";

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join("/");
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.text();
  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("Content-Type") ?? "application/json",
  };
  const acceptLanguage = req.headers.get("Accept-Language");
  if (acceptLanguage) {
    headers["Accept-Language"] = acceptLanguage;
  }
  const res = await proxyToGo(target + req.nextUrl.search, {
    method: req.method,
    body,
    headers,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

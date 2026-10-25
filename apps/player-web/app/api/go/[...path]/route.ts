import { NextRequest, NextResponse } from "next/server";
import {
  goClientResponseHeaders,
  goProxyHeaders,
  proxyToGoWithRefresh,
} from "@/lib/api/proxy-go";

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join("/");
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.text();
  const headers = goProxyHeaders(req);
  const res = await proxyToGoWithRefresh(target + req.nextUrl.search, {
    method: req.method,
    body,
    headers,
  });
  const responseHeaders = goClientResponseHeaders(res, headers["X-Trace-ID"]);
  // Fetch forbids a body on these statuses (Go often returns 204 for mutations).
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return new NextResponse(null, { status: res.status, headers: responseHeaders });
  }
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

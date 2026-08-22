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
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: goClientResponseHeaders(res, headers["X-Trace-ID"]),
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

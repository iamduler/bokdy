import { NextRequest, NextResponse } from "next/server";
import {
  goClientResponseHeaders,
  goProxyHeaders,
  proxyToGoWithRefresh,
} from "@/lib/api/proxy-go";

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join("/");
  const contentType = req.headers.get("content-type") ?? "";
  const body = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : contentType.includes("multipart/form-data")
      ? await req.arrayBuffer()
      : await req.text();
  const headers = goProxyHeaders(req);
  const res = await proxyToGoWithRefresh(target + req.nextUrl.search, {
    method: req.method,
    body,
    headers,
  });
  const responseHeaders = goClientResponseHeaders(res, headers["X-Trace-ID"]);
  // Fetch forbids a body on these statuses (Go often returns 204 for open/close/etc.).
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return new NextResponse(null, { status: res.status, headers: responseHeaders });
  }
  const responseType = res.headers.get("content-type") ?? "";
  if (responseType.startsWith("image/") || responseType.startsWith("application/octet-stream")) {
    return new NextResponse(await res.arrayBuffer(), {
      status: res.status,
      headers: responseHeaders,
    });
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

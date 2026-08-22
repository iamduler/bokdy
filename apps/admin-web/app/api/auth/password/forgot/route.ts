import { NextResponse } from "next/server";

import { goBaseUrl } from "@/lib/api/proxy-go";

export async function POST(req: Request) {
  const body = await req.text();
  const upstream = await fetch(`${goBaseUrl().replace(/\/$/, "")}/auth/password/forgot`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
    cache: "no-store",
  });
  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const text = await upstream.text();
  return new NextResponse(text || upstream.statusText, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

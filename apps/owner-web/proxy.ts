import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { AUTH_PRESENT_COOKIE } from "./lib/auth";

const intl = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = /\/(en|vi)\/dashboard(\/|$)/.test(pathname);
  if (isProtected && !req.cookies.get(AUTH_PRESENT_COOKIE)) {
    const locale = pathname.split("/")[1] || "en";
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }
  return intl(req);
}

export const config = {
  matcher: ["/", "/(en|vi)/:path*"],
};

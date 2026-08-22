import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { AUTH_PRESENT_COOKIE } from "./lib/auth";

const intl = createMiddleware(routing);

function loginPath(pathname: string) {
  const prefixed = pathname.match(/^\/(en|vi)(\/|$)/);
  if (!prefixed || prefixed[1] === routing.defaultLocale) return "/login";
  return `/${prefixed[1]}/login`;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = /^(\/(en|vi))?\/dashboard(\/|$)/.test(pathname);
  if (isProtected && !req.cookies.get(AUTH_PRESENT_COOKIE)) {
    return NextResponse.redirect(new URL(loginPath(pathname), req.url));
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

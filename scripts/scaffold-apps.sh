#!/usr/bin/env bash
set -euo pipefail
ROOT=/var/www/nginx/html/bokdy

create_app() {
  local name="$1"
  local pkg="$2"
  local audience="$3"
  local port="$4"
  local cookie_prefix="$5"
  local brand="$6"
  local dir="$ROOT/apps/$name"

  mkdir -p \
    "$dir/app/api/auth/login" \
    "$dir/app/api/auth/register" \
    "$dir/app/api/auth/logout" \
    "$dir/app/api/auth/session" \
    "$dir/app/api/auth/refresh" \
    "$dir/app/api/go" \
    "$dir/app/[locale]/login" \
    "$dir/app/[locale]/register" \
    "$dir/app/[locale]/dashboard" \
    "$dir/messages" \
    "$dir/i18n" \
    "$dir/lib/api" \
    "$dir/providers" \
    "$dir/public"

  # catch-all go proxy dir
  mkdir -p "$dir/app/api/go/[...path]"

  cat > "$dir/package.json" <<EOF
{
  "name": "$pkg",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port $port",
    "build": "next build",
    "start": "next start --port $port",
    "lint": "eslint"
  },
  "dependencies": {
    "@bokdy/ui": "workspace:*",
    "@tanstack/react-query": "^5.101.0",
    "next": "16.2.9",
    "next-intl": "^4.13.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@bokdy/config": "workspace:*",
    "@bokdy/sdk": "workspace:*",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
EOF

  cat > "$dir/tsconfig.json" <<'EOF'
{
  "extends": "@bokdy/config/tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

  cat > "$dir/next.config.ts" <<'EOF'
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@bokdy/ui"],
};

export default withNextIntl(nextConfig);
EOF

  cat > "$dir/postcss.config.mjs" <<'EOF'
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
EOF

  cat > "$dir/app/globals.css" <<'EOF'
@import "tailwindcss";

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

body {
  background: var(--background);
  color: var(--foreground);
  min-height: 100dvh;
}
EOF

  cat > "$dir/lib/auth.ts" <<EOF
export const SESSION_COOKIE = "${cookie_prefix}_session";
export const REFRESH_COOKIE = "${cookie_prefix}_refresh";
export const AUTH_PRESENT_COOKIE = "${cookie_prefix}_auth";
export const ORG_COOKIE = "${cookie_prefix}_org";
export const AUDIENCE = "${audience}" as const;
EOF

  cat > "$dir/lib/api/proxy-go.ts" <<'EOF'
import { cookies } from "next/headers";
import {
  AUTH_PRESENT_COOKIE,
  ORG_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth";

export function goBaseUrl(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080/api/v1"
  );
}

export async function readSessionTokens() {
  const store = await cookies();
  const accessToken = store.get(SESSION_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!accessToken && !refreshToken) return null;
  return {
    accessToken,
    refreshToken,
    organizationId: store.get(ORG_COOKIE)?.value,
  };
}

export async function setAuthCookiesOnStore(opts: {
  accessToken: string;
  refreshToken: string;
}) {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, opts.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 15 * 60,
  });
  store.set(REFRESH_COOKIE, opts.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  store.set(AUTH_PRESENT_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthCookiesOnStore() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(AUTH_PRESENT_COOKIE);
}

export async function proxyToGo(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const tokens = await readSessionTokens();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  if (tokens?.organizationId) {
    headers.set("X-Organization-ID", tokens.organizationId);
  }
  const url = `${goBaseUrl().replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  return fetch(url, { ...init, headers, cache: "no-store" });
}
EOF

  write_auth_route() {
    local action="$1"
    cat > "$dir/app/api/auth/$action/route.ts" <<EOF
import { NextResponse } from "next/server";
import { goBaseUrl, setAuthCookiesOnStore } from "@/lib/api/proxy-go";

export async function POST(req: Request) {
  const body = await req.text();
  const upstream = await fetch(\`\${goBaseUrl().replace(/\\/\$/, "")}/auth/$action\`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
    cache: "no-store",
  });
  const text = await upstream.text();
  if (!upstream.ok) {
    return new NextResponse(text || upstream.statusText, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  }
  if (text) {
    try {
      const json = JSON.parse(text) as {
        data?: { access_token?: string; refresh_token?: string };
      };
      const access = json.data?.access_token;
      const refresh = json.data?.refresh_token;
      if (access && refresh) {
        await setAuthCookiesOnStore({ accessToken: access, refreshToken: refresh });
      }
    } catch {
      // ignore parse errors
    }
  }
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
EOF
  }

  write_auth_route login
  write_auth_route register
  write_auth_route refresh

  cat > "$dir/app/api/auth/logout/route.ts" <<'EOF'
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
EOF

  cat > "$dir/app/api/auth/session/route.ts" <<'EOF'
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
EOF

  cat > "$dir/app/api/go/[...path]/route.ts" <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { proxyToGo } from "@/lib/api/proxy-go";

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join("/");
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.text();
  const res = await proxyToGo(target + req.nextUrl.search, {
    method: req.method,
    body,
    headers: { "Content-Type": req.headers.get("Content-Type") ?? "application/json" },
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
EOF

  cat > "$dir/i18n/routing.ts" <<'EOF'
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "vi"],
  defaultLocale: "en",
  localePrefix: "always",
});
EOF

  cat > "$dir/i18n/request.ts" <<'EOF'
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "vi")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
EOF

  cat > "$dir/proxy.ts" <<EOF
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { AUTH_PRESENT_COOKIE } from "./lib/auth";

const intl = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = /\\/(en|vi)\\/dashboard(\\/|\$)/.test(pathname);
  if (isProtected && !req.cookies.get(AUTH_PRESENT_COOKIE)) {
    const locale = pathname.split("/")[1] || "en";
    return NextResponse.redirect(new URL(\`/\${locale}/login\`, req.url));
  }
  return intl(req);
}

export const config = {
  matcher: ["/", "/(en|vi)/:path*"],
};
EOF

  cat > "$dir/messages/en.json" <<EOF
{
  "common": {
    "appName": "$brand",
    "loading": "Loading…",
    "logout": "Log out"
  },
  "auth": {
    "loginTitle": "Sign in",
    "registerTitle": "Create account",
    "email": "Email",
    "password": "Password",
    "fullName": "Full name",
    "submitLogin": "Sign in",
    "submitRegister": "Register",
    "noAccount": "Need an account?",
    "hasAccount": "Already have an account?"
  },
  "shell": {
    "dashboard": "Dashboard",
    "welcome": "Welcome to $brand",
    "subtitle": "Foundation scaffold — no business domain yet."
  }
}
EOF

  cat > "$dir/messages/vi.json" <<EOF
{
  "common": {
    "appName": "$brand",
    "loading": "Đang tải…",
    "logout": "Đăng xuất"
  },
  "auth": {
    "loginTitle": "Đăng nhập",
    "registerTitle": "Tạo tài khoản",
    "email": "Email",
    "password": "Mật khẩu",
    "fullName": "Họ tên",
    "submitLogin": "Đăng nhập",
    "submitRegister": "Đăng ký",
    "noAccount": "Chưa có tài khoản?",
    "hasAccount": "Đã có tài khoản?"
  },
  "shell": {
    "dashboard": "Bảng điều khiển",
    "welcome": "Chào mừng đến $brand",
    "subtitle": "Scaffold nền tảng — chưa có domain nghiệp vụ."
  }
}
EOF

  cat > "$dir/app/layout.tsx" <<'EOF'
import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
EOF

  cat > "$dir/app/[locale]/layout.tsx" <<'EOF'
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "@/providers/providers";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "vi")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
EOF

  cat > "$dir/providers/providers.tsx" <<'EOF'
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
EOF

  cat > "$dir/app/[locale]/page.tsx" <<'EOF'
import { redirect } from "next/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}
EOF

  cat > "$dir/app/[locale]/login/page.tsx" <<'EOF'
"use client";

import { AuthCard, Button, Input, Label } from "@bokdy/ui";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setPending(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <AuthCard title={`${tc("appName")} — ${t("loginTitle")}`}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {t("submitLogin")}
          </Button>
          <p className="text-sm text-zinc-600">
            {t("noAccount")}{" "}
            <Link className="underline" href={`/${locale}/register`}>
              {t("submitRegister")}
            </Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}
EOF

  cat > "$dir/app/[locale]/register/page.tsx" <<'EOF'
"use client";

import { AuthCard, Button, Input, Label } from "@bokdy/ui";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    setPending(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const login = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!login.ok) {
      router.push(`/${locale}/login`);
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <AuthCard title={`${tc("appName")} — ${t("registerTitle")}`}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {t("submitRegister")}
          </Button>
          <p className="text-sm text-zinc-600">
            {t("hasAccount")}{" "}
            <Link className="underline" href={`/${locale}/login`}>
              {t("submitLogin")}
            </Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}
EOF

  cat > "$dir/app/[locale]/dashboard/page.tsx" <<'EOF'
"use client";

import { Button } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{tc("appName")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("welcome")}</h1>
          <p className="mt-1 text-zinc-600">{t("subtitle")}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          {tc("logout")}
        </Button>
      </header>
    </main>
  );
}
EOF

  cat > "$dir/.env.example" <<EOF
API_INTERNAL_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:$port
EOF

  echo "created $name on :$port"
}

create_app "player-web" "@bokdy/player-web" "player" "3000" "bokdy_player" "Bokdy Player"
create_app "owner-web" "@bokdy/owner-web" "owner" "3001" "bokdy_owner" "Bokdy Owner"
create_app "admin-web" "@bokdy/admin-web" "admin" "3002" "bokdy_admin" "Bokdy Admin"

"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { AdminHealthBadge } from "@/components/admin-health-badge";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useLogout } from "@/hooks/use-auth";
import { useMe } from "@/hooks/use-me";
import { ApiError } from "@/lib/api/errors";

export function AdminShell({ children }: { children: ReactNode }) {
  const tc = useTranslations("common");
  const ts = useTranslations("shell");
  const router = useRouter();
  const logout = useLogout();
  const { data, isLoading, isError, error } = useMe();
  const signingOut = useRef(false);

  useEffect(() => {
    if (signingOut.current) return;

    const forbidden =
      (isError && error instanceof ApiError && (error.status === 401 || error.status === 403)) ||
      (data?.user != null && !data.user.is_system_admin);

    if (!forbidden) return;

    signingOut.current = true;
    void logout.mutateAsync().catch(() => undefined).finally(() => {
      router.push("/login");
      router.refresh();
    });
  }, [data, isError, error, logout, router]);

  async function onLogout() {
    await logout.mutateAsync().catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  const email = data?.user?.email;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <p className="text-sm font-semibold tracking-tight">{tc("appName")}</p>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <ThemeSwitcher persistToProfile />
            <AdminHealthBadge />
            {isLoading ? (
              <span className="text-sm text-muted-foreground">{tc("loading")}</span>
            ) : email ? (
              <div className="hidden items-center gap-3 sm:flex">
                <Link href="/sessions" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                  {ts("sessions")}
                </Link>
                <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                  {email}
                </Link>
              </div>
            ) : (
              <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                {ts("profile")}
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={onLogout} disabled={logout.isPending}>
              {tc("logout")}
            </Button>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}

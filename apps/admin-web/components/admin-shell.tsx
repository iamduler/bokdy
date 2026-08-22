"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  TooltipProvider,
  cn,
} from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AdminHeader } from "@/components/shell/admin-header";
import { AdminSidebarChrome } from "@/components/shell/admin-sidebar";
import { ShellTitleProvider } from "@/components/shell/shell-title";
import { useLogout } from "@/hooks/use-auth";
import { useMe } from "@/hooks/use-me";
import { useRouter } from "@/i18n/navigation";
import { ADMIN_SIDEBAR_COLLAPSE_KEY } from "@/lib/admin-nav";
import { ApiError } from "@/lib/api/errors";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}

function displayNameFromMe(user: {
  display_name?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string | undefined {
  const display = user.display_name?.trim();
  if (display) return display;
  const full = user.full_name?.trim();
  if (full) return full;
  const parts = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return parts || undefined;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const tc = useTranslations("common");
  const t = useTranslations("shell");
  const router = useRouter();
  const logout = useLogout();
  const { data, isLoading, isError, error } = useMe();
  const signingOut = useRef(false);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (signingOut.current) return;

    const forbidden =
      (isError && error instanceof ApiError && (error.status === 401 || error.status === 403)) ||
      (data?.user != null && !data.user.is_system_admin);

    if (!forbidden) return;

    signingOut.current = true;
    void logout
      .mutateAsync()
      .catch(() => undefined)
      .finally(() => {
        router.push("/login");
        router.refresh();
      });
  }, [data, isError, error, logout, router]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(next);
      return next;
    });
  }

  const email = data?.user?.email;
  const displayName = data?.user ? displayNameFromMe(data.user) : undefined;

  return (
    <TooltipProvider delayDuration={200}>
      <ShellTitleProvider>
      <div className="flex min-h-dvh bg-background">
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 border-r border-border transition-[width] duration-200 md:flex md:flex-col",
            hydrated && collapsed ? "w-16" : "w-60",
          )}
        >
          <AdminSidebarChrome
            collapsed={hydrated ? collapsed : false}
            onToggleCollapse={toggleCollapsed}
          />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0" showClose>
            <SheetHeader className="sr-only">
              <SheetTitle>{tc("appName")}</SheetTitle>
              <SheetDescription>{t("openMenu")}</SheetDescription>
            </SheetHeader>
            <AdminSidebarChrome collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
            email={email}
            displayName={displayName}
            onOpenMobileNav={() => setMobileOpen(true)}
          />
          <div className="flex-1 overflow-auto soft-scrollbar">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">{tc("loading")}</p>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
      </ShellTitleProvider>
    </TooltipProvider>
  );
}

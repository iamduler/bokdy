"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · designed-as-app
 */

import { SidebarInset, SidebarProvider, Toaster, TooltipProvider } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AdminHeader } from "@/components/shell/admin-header";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
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
  const router = useRouter();
  const logout = useLogout();
  const { data, isLoading, isError, error } = useMe();
  const signingOut = useRef(false);

  const [collapsed, setCollapsed] = useState(false);
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

  const email = data?.user?.email;
  const displayName = data?.user ? displayNameFromMe(data.user) : undefined;

  return (
    <TooltipProvider delayDuration={200}>
      <ShellTitleProvider>
      <SidebarProvider
        className="h-svh overflow-hidden"
        open={hydrated ? !collapsed : true}
        onOpenChange={(open) => {
          setCollapsed(!open);
          writeCollapsed(!open);
        }}
      >
        <AdminSidebar email={email} displayName={displayName} />
        <SidebarInset className="min-h-0 overflow-hidden">
          <AdminHeader />
          <div className="min-h-0 flex-1 overflow-auto soft-scrollbar">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">{tc("loading")}</p>
            ) : (
              children
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
      </ShellTitleProvider>
      <Toaster />
    </TooltipProvider>
  );
}

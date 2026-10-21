"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI shell
 */

import { SidebarInset, SidebarProvider, Toaster, TooltipProvider, cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";

import { AdminHeader } from "@/components/shell/admin-header";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { ShellTitleProvider } from "@/components/shell/shell-title";
import { useLogout } from "@/hooks/use-auth";
import { useMe } from "@/hooks/use-me";
import { useRouter } from "@/i18n/navigation";
import { ADMIN_SIDEBAR_COLLAPSE_KEY } from "@/lib/admin-nav";
import { ApiError } from "@/lib/api/errors";

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

  // Soft UI: always icon rail on desktop. Persist key stays for future.
  useEffect(() => {
    writeCollapsed(true);
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <ShellTitleProvider>
        {/* Provider must wrap header (SidebarTrigger) and still keep header full-width above the rail */}
        <SidebarProvider
          className={cn(
            "shell--admin flex h-svh min-h-0 w-full flex-col overflow-hidden bg-shell-bg",
          )}
          open={false}
          onOpenChange={() => {
            writeCollapsed(true);
          }}
        >
          <AdminHeader email={email} displayName={displayName} />

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <AdminSidebar />
            <SidebarInset className="min-h-0 overflow-hidden bg-transparent">
              <div className="page-canvas min-h-0 flex-1 overflow-auto soft-scrollbar bg-transparent">
                {isLoading ? (
                  <p className="p-4 text-sm text-muted-foreground">{tc("loading")}</p>
                ) : (
                  children
                )}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ShellTitleProvider>
      <Toaster />
    </TooltipProvider>
  );
}

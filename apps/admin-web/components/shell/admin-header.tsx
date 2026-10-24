"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI top chrome
 */

import { BokdyMark } from "@bokdy/brand";
import { SidebarTrigger } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AudienceSegment } from "@/components/shell/audience-segment";
import { NotificationBell } from "@/components/shell/notification-bell";
import { QuickSearchButton } from "@/components/shell/quick-search-button";
import { useShellTitle } from "@/components/shell/shell-title";
import { UserMenu } from "@/components/shell/user-menu";
import { Link } from "@/i18n/navigation";

function useGreetingKey():
  | "greetingMorning"
  | "greetingAfternoon"
  | "greetingEvening" {
  const [key, setKey] = useState<
    "greetingMorning" | "greetingAfternoon" | "greetingEvening"
  >("greetingMorning");
  useEffect(() => {
    const hour = new Date().getHours();
    setKey(
      hour < 12
        ? "greetingMorning"
        : hour < 18
          ? "greetingAfternoon"
          : "greetingEvening",
    );
  }, []);
  return key;
}

export function AdminHeader({
  email,
  displayName,
}: {
  email?: string;
  displayName?: string;
}) {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const { setLeadingSlot, setActionSlot } = useShellTitle();
  const greetingKey = useGreetingKey();

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 bg-transparent">
      <div className="soft-chrome-bar relative mx-4 my-2 flex h-14 items-center gap-3 border-0 px-4 md:h-16 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="md:hidden" aria-label={t("openMenu")} />

          <Link
            href="/organizations"
            className="flex min-w-0 items-center gap-2.5"
            aria-label={tc("appName")}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/5 md:size-10 dark:bg-white dark:ring-black/10">
              <BokdyMark
                alt={tc("appName")}
                className="size-6 object-contain md:size-7"
                width={28}
                height={28}
              />
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-sm font-semibold text-foreground">
                {tc("appName")}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {t("brandSubtitle")}
              </span>
            </span>
          </Link>

          <AudienceSegment className="ml-1" />

          <div
            ref={setLeadingSlot}
            className="flex items-center empty:hidden"
          />
        </div>

        {/* Viewport-centered portal for page actions (e.g. form save) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            ref={setActionSlot}
            className="pointer-events-auto flex items-center gap-2 empty:hidden"
          />
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1.5 md:gap-2">
          <QuickSearchButton />
          <NotificationBell placement="header" />
          <UserMenu
            email={email}
            displayName={displayName}
            layout="header-greeting"
            greeting={t(greetingKey)}
          />
        </div>
      </div>
    </header>
  );
}

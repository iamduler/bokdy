"use client";

import { Button, Popover, PopoverContent, PopoverTrigger } from "@bokdy/ui";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

/** Notification bell. No notification API yet (`F-ADMIN-PLUS-07`). */
export function NotificationBell({ placement = "header" }: { placement?: "header" | "sidebar" }) {
  const t = useTranslations("shell");

  return (
    <Popover>
      <PopoverTrigger asChild>
        {placement === "sidebar" ? (
          <button type="button" className="sidebar-menu-button" aria-label={t("notifications")}>
            <Bell />
            <span className="group-data-[collapsible=icon]:hidden">{t("notifications")}</span>
          </button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="relative h-8 w-8 px-0"
            aria-label={t("notifications")}
          >
            <Bell className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={placement === "sidebar" ? "right" : "bottom"}
        align="end"
        className="w-72 space-y-2 p-3"
      >
        <p className="text-sm font-semibold text-foreground">{t("notifications")}</p>
        <p className="text-xs text-muted-foreground">{t("notificationsEmpty")}</p>
        <p className="rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground">
          {t("notificationsUnavailable")}
        </p>
      </PopoverContent>
    </Popover>
  );
}

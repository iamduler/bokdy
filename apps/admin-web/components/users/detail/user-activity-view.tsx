"use client";

import { Button, formatUserDateTime, Spinner, useUserDateTimePrefs } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { useUserActivity } from "@/hooks/use-admin-users";

export function UserActivityView({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("users.activity");
  const tc = useTranslations("common");
  const prefs = useUserDateTimePrefs();
  const { userId } = useUserDetail();
  const { data: events = [], isLoading, isError, refetch, isFetching } = useUserActivity(userId);

  const shell = embedded
    ? "flex flex-col"
    : "flex min-h-0 flex-1 flex-col overflow-auto soft-scrollbar p-4 md:p-6";

  return (
    <div className={shell}>
      <EntityDetailPanel title={t("title")}>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            {tc("loading")}
          </p>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{t("loadError")}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {tc("retry")}
            </Button>
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div>
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-1 border-b border-border/40 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t(`event.${event.event_type}`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[event.ip_address, event.user_agent].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatUserDateTime(event.created_at, prefs)}
                </p>
              </div>
            ))}
          </div>
        )}
      </EntityDetailPanel>
    </div>
  );
}

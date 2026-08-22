"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { useUserActivity } from "@/hooks/use-admin-users";

export function UserActivityView() {
  const t = useTranslations("users.activity");
  const tc = useTranslations("common");
  const { userId } = useUserDetail();
  const { data: events = [], isLoading, isError, refetch, isFetching } = useUserActivity(userId);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground md:p-6">{tc("loading")}</p>;
  }

  if (isError) {
    return (
      <div className="m-4 space-y-2 rounded-lg border border-destructive/30 p-4 md:m-6">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {tc("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto soft-scrollbar p-4 md:p-6">
      <h2 className="mb-4 font-display text-base font-bold">{t("title")}</h2>
      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="rounded-lg border border-border bg-card/60 p-3">
            <div className="flex justify-between gap-2">
              <p className="text-sm font-semibold">{t(`event.${e.event_type}`)}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {[e.ip_address, e.user_agent].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        ))}
        {events.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
      </div>
    </div>
  );
}

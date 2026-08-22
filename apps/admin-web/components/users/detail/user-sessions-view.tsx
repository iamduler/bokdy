"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useUserDetail } from "@/components/users/detail/user-detail-context";
import {
  useAdminUserSessions,
  useRevokeAllUserSessions,
  useRevokeUserSession,
} from "@/hooks/use-admin-users";

export function UserSessionsView() {
  const t = useTranslations("users.sessions");
  const tc = useTranslations("common");
  const { userId } = useUserDetail();
  const { data: sessions = [], isLoading, isError, refetch, isFetching } = useAdminUserSessions(userId);
  const revokeOne = useRevokeUserSession(userId);
  const revokeAll = useRevokeAllUserSessions(userId);

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto soft-scrollbar p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("count", { count: sessions.length })}</p>
        <Button
          size="sm"
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={sessions.length === 0 || revokeAll.isPending}
          onClick={() => revokeAll.mutate()}
        >
          {t("revokeAll")}
        </Button>
      </div>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-semibold">{s.user_agent ?? t("unknownDevice")}</p>
              <p className="text-muted-foreground">{s.ip_address ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {t("status")}: {s.status}
                {s.last_activity_at ? ` · ${new Date(s.last_activity_at).toLocaleString()}` : ""}
              </p>
            </div>
            {s.status === "active" ? (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-destructive"
                disabled={revokeOne.isPending}
                onClick={() => revokeOne.mutate(s.id)}
              >
                {t("revoke")}
              </Button>
            ) : null}
          </div>
        ))}
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : null}
      </div>
    </div>
  );
}

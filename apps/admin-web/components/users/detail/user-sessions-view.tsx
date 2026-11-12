"use client";

import { Button, formatUserDateTime, Spinner, useUserDateTimePrefs } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";
import { useUserDetail } from "@/components/users/detail/user-detail-context";
import {
  useAdminUserSessions,
  useRevokeAllUserSessions,
  useRevokeUserSession,
} from "@/hooks/use-admin-users";

const SESSION_STATUS_TONE: Record<string, SoftStatusToneKey> = {
  active: "emerald",
  expired: "amber",
  revoked: "rose",
};

const SESSION_STATUSES = ["active", "expired", "revoked"] as const;

type SessionStatus = (typeof SESSION_STATUSES)[number];

function isSessionStatus(status: string): status is SessionStatus {
  return (SESSION_STATUSES as readonly string[]).includes(status);
}

export function UserSessionsView({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("users.sessions");
  const tc = useTranslations("common");
  const prefs = useUserDateTimePrefs();
  const { userId } = useUserDetail();
  const { data: sessions = [], isLoading, isError, refetch, isFetching } = useAdminUserSessions(userId);
  const revokeOne = useRevokeUserSession(userId);
  const revokeAll = useRevokeAllUserSessions(userId);

  const shell = embedded
    ? "flex flex-col"
    : "flex min-h-0 flex-1 flex-col overflow-auto soft-scrollbar p-4 md:p-6";

  return (
    <div className={shell}>
      <EntityDetailPanel
        title={isLoading ? undefined : t("count", { count: sessions.length })}
        actions={
          !isLoading && !isError ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={sessions.length === 0 || revokeAll.isPending}
              onClick={() => revokeAll.mutate()}
            >
              {t("revokeAll")}
            </Button>
          ) : null
        }
      >
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
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div>
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-3 border-b border-border/40 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {session.user_agent ?? t("unknownDevice")}
                  </p>
                  <p className="text-sm text-muted-foreground">{session.ip_address ?? "—"}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <SoftStatusChip
                      label={
                        isSessionStatus(session.status)
                          ? t(`statusLabel.${session.status}`)
                          : session.status
                      }
                      tone={SESSION_STATUS_TONE[session.status] ?? "muted"}
                    />
                    {session.last_activity_at ? (
                      <span className="text-xs text-muted-foreground">
                        {formatUserDateTime(session.last_activity_at, prefs)}
                      </span>
                    ) : null}
                  </div>
                </div>
                {session.status === "active" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={revokeOne.isPending}
                    onClick={() => revokeOne.mutate(session.id)}
                  >
                    {t("revoke")}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </EntityDetailPanel>
    </div>
  );
}

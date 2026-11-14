"use client";

import { Button, formatUserDateTime, Spinner, useUserDateTimePrefs } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";
import {
  useRevokeAllSessions,
  useRevokeSession,
  useSessions,
} from "@/hooks/use-sessions";

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

export function SessionsList({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("sessions");
  const tc = useTranslations("common");
  const prefs = useUserDateTimePrefs();
  const { data: allSessions = [], isLoading, isError, refetch, isFetching } = useSessions();
  const sessions = allSessions.filter((session) => session.status !== "revoked");
  const revokeOne = useRevokeSession();
  const revokeAll = useRevokeAllSessions();

  const shell = embedded
    ? "flex flex-col"
    : "flex min-h-0 flex-1 flex-col";

  return (
    <div className={shell}>
      <EntityDetailPanel
        title={
          isLoading
            ? undefined
            : t("subtitle", { count: sessions.length })
        }
        hint={embedded ? undefined : t("pageDescription")}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {session.user_agent ?? t("unknownDevice")}
                    </p>
                    {session.is_current_session ? (
                      <SoftStatusChip label={t("current")} tone="sky" />
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{session.ip_address ?? t("unknownIp")}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <SoftStatusChip
                      label={
                        isSessionStatus(session.status)
                          ? t(`statusLabel.${session.status}`)
                          : session.status
                      }
                      tone={SESSION_STATUS_TONE[session.status] ?? "muted"}
                    />
                    <span className="text-xs text-muted-foreground">
                      {t("lastSeen", {
                        date: formatUserDateTime(
                          session.last_activity_at || session.created_at,
                          prefs,
                        ),
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("expiresAt")}: {formatUserDateTime(session.expires_at, prefs)}
                    </span>
                  </div>
                </div>
                {session.status === "active" && !session.is_current_session ? (
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

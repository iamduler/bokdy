"use client";

import { AuthActionButton, AuthAlert, SecurityRiskBadge } from "@bokdy/ui";
import { useFormatter, useTranslations } from "next-intl";

import { useRevokeAllSessions, useRevokeSession, useSessions } from "@/hooks/use-sessions";

function riskForUserAgent(userAgent?: string | null): "low" | "medium" | "high" {
  if (!userAgent) return "medium";
  if (/unknown/i.test(userAgent)) return "high";
  if (/iphone|android|windows|mac os|chrome|safari|firefox/i.test(userAgent)) return "low";
  return "medium";
}

export function SessionsList() {
  const t = useTranslations("sessions");
  const tc = useTranslations("common");
  const format = useFormatter();
  const { data, isLoading, isError } = useSessions();
  const revokeOne = useRevokeSession();
  const revokeAll = useRevokeAllSessions();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{tc("loading")}</p>;
  }

  if (isError) {
    return <AuthAlert tone="danger">{t("loadError")}</AuthAlert>;
  }

  if (!data?.length) {
    return <AuthAlert>{t("empty")}</AuthAlert>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle", { count: data.length })}</p>
        </div>
        <div className="w-full sm:w-auto sm:min-w-48">
          <AuthActionButton tone="danger" onClick={() => revokeAll.mutate()} disabled={revokeAll.isPending}>
            {t("revokeAll")}
          </AuthActionButton>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((session) => {
          const risk = riskForUserAgent(session.user_agent);
          return (
            <div key={session.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{session.user_agent || t("unknownDevice")}</p>
                    {session.is_current_session ? (
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        {t("current")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{session.ip_address || t("unknownIp")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("lastSeen", {
                      date: format.dateTime(new Date(session.last_activity_at || session.created_at), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                    })}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <SecurityRiskBadge
                    level={risk}
                    labels={{
                      low: t("risk.low"),
                      medium: t("risk.medium"),
                      high: t("risk.high"),
                    }}
                  />
                  {!session.is_current_session ? (
                    <button
                      type="button"
                      onClick={() => revokeOne.mutate(session.id)}
                      className="text-sm font-medium text-destructive hover:underline"
                      disabled={revokeOne.isPending}
                    >
                      {t("revoke")}
                    </button>
                  ) : null}
                </div>
              </div>

              <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("status")}</dt>
                  <dd className="mt-1 font-medium">{session.status}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("expiresAt")}</dt>
                  <dd className="mt-1 font-medium">
                    {format.dateTime(new Date(session.expires_at), { dateStyle: "medium", timeStyle: "short" })}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

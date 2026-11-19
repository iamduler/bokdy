"use client";

import { Button, cn, formatUserDateTime, Spinner, useUserDateTimePrefs } from "@bokdy/ui";
import { Download, History } from "lucide-react";
import { useTranslations } from "next-intl";

import { softDetailSectionGap } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { EntityUnavailableButton } from "@/components/entity/unavailable";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";
import { useOrganizationActivity } from "@/hooks/use-admin-organizations";
import type { AdminOrganizationActivityEvent } from "@/lib/api/admin";

export function OrganizationActivityView() {
  const t = useTranslations("organization.detailActivity");
  const tu = useTranslations("organization");
  const tc = useTranslations("common");
  const prefs = useUserDateTimePrefs();
  const { orgId } = useOrganizationDetail();
  const { data: events = [], isLoading, isError, refetch, isFetching } = useOrganizationActivity(orgId);

  return (
    <div className={cn("flex flex-col p-5 pt-2 md:px-6", softDetailSectionGap)}>
      <EntityDetailPanel
        title={t("title")}
        icon={<History className="size-4" aria-hidden />}
        tone="sky"
        actions={
          <EntityUnavailableButton reason={tu("unavailable")} className="gap-1">
            <Download className="h-3.5 w-3.5" />
            {t("export")}
          </EntityUnavailableButton>
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
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              {tc("retry")}
            </Button>
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ol>
            {events.map((event, index) => (
              <li key={event.id} className="relative flex gap-3">
                <div className="flex w-4 shrink-0 flex-col items-center">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", dotClass(event))} />
                  {index < events.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
                </div>
                <div className={cn("min-w-0 flex-1", index < events.length - 1 && "pb-4")}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 text-sm font-medium text-foreground">{eventLabel(t, event)}</p>
                    <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatUserDateTime(event.created_at, prefs)}
                    </p>
                  </div>
                  <ActivityMeta event={event} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </EntityDetailPanel>
    </div>
  );
}

function ActivityMeta({ event }: { event: AdminOrganizationActivityEvent }) {
  const t = useTranslations("organization.detailActivity");
  const parts = [
    event.actor_name ? t("byActor", { name: event.actor_name }) : null,
    event.reason ? t("reason", { reason: event.reason }) : null,
  ].filter((part): part is string => Boolean(part));
  if (parts.length === 0) return null;
  return <p className="mt-0.5 text-xs text-muted-foreground">{parts.join(" · ")}</p>;
}

function dotClass(event: AdminOrganizationActivityEvent) {
  if (event.event_type === "OrganizationSuspended" || event.event_type === "StaffSuspended") {
    return "bg-rose-500";
  }
  if (
    event.event_type === "OrganizationRestored" ||
    event.event_type === "OrganizationActivated" ||
    event.event_type === "StaffRestored"
  ) {
    return "bg-emerald-500";
  }
  if (event.action === "updated") return "bg-amber-500";
  return "bg-sky-500";
}

function eventLabel(
  t: ReturnType<typeof useTranslations<"organization.detailActivity">>,
  event: AdminOrganizationActivityEvent,
) {
  const key = `events.${event.event_type}`;
  if (t.has(key)) return t(key);
  const actionKey = `actions.${event.action}`;
  const action = t.has(actionKey) ? t(actionKey) : event.action;
  return t("eventFallback", { entity: event.entity_type, action });
}

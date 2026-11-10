"use client";

import { Spinner } from "@bokdy/ui";
import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { HolidayLayerForm, type HolidayDraft } from "@/components/holidays/holiday-layer-form";
import { useCalendarHolidays, useOrganizationHolidays, useReplaceOrganizationHolidays } from "@/hooks/use-pricing";

import { useOrganizationDetail } from "../organization-detail-context";

export function OrganizationHolidaysView() {
  const t = useTranslations("organization.holidays");
  const { orgId } = useOrganizationDetail();
  const query = useOrganizationHolidays(orgId);
  const calendar = useCalendarHolidays();
  const save = useReplaceOrganizationHolidays(orgId);
  const rows: HolidayDraft[] = (query.data?.holidays ?? []).map((holiday) => ({
    holiday_on: holiday.holiday_on,
    name: holiday.name,
    effect: holiday.effect,
  }));
  const covered = new Set(rows.map((row) => row.holiday_on));

  return (
    <div className="flex flex-col gap-4 p-5 pt-2 md:px-6">
      <EntityDetailPanel
        title={t("orgTitle")}
        hint={t("orgHint")}
        icon={<CalendarDays className="size-4" aria-hidden />}
        tone="sky"
      >
        {query.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />{t("loading")}</p>
        ) : query.isError ? (
          <p className="text-sm text-destructive">{t("loadError")}</p>
        ) : (
          <HolidayLayerForm rows={rows} showEffect pending={save.isPending} onSave={(next) => save.mutateAsync(next)} />
        )}
      </EntityDetailPanel>
      {calendar.isSuccess ? (
        <EntityDetailPanel title={t("systemTitle")} hint={t("systemReadOnly")}>
          {calendar.data.holidays.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
          <ul className="space-y-2">
            {calendar.data.holidays.map((holiday) => (
              <li key={holiday.id} className="text-sm">
                {holiday.holiday_on} · {holiday.name}
                {covered.has(holiday.holiday_on) ? <span className="text-muted-foreground"> · {t("overridden")}</span> : null}
              </li>
            ))}
          </ul>
        </EntityDetailPanel>
      ) : null}
    </div>
  );
}

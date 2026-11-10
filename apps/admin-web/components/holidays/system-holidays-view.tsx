"use client";

import { Spinner } from "@bokdy/ui";
import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { HolidayLayerForm, type HolidayDraft } from "@/components/holidays/holiday-layer-form";
import { useCalendarHolidays, useReplaceCalendarHolidays } from "@/hooks/use-pricing";

export function SystemHolidaysView() {
  const t = useTranslations("organization.holidays");
  const query = useCalendarHolidays();
  const save = useReplaceCalendarHolidays();
  const rows: HolidayDraft[] = (query.data?.holidays ?? []).map((holiday) => ({
    holiday_on: holiday.holiday_on,
    name: holiday.name,
    effect: "include",
  }));

  return (
    <div className="page-canvas p-4 md:p-6">
      <EntityDetailPanel
        title={t("systemTitle")}
        hint={t("systemHint")}
        icon={<CalendarDays className="size-4" aria-hidden />}
        tone="sky"
      >
        {query.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />{t("loading")}</p>
        ) : query.isError ? (
          <p className="text-sm text-destructive">{t("loadError")}</p>
        ) : (
          <HolidayLayerForm
            rows={rows}
            showEffect={false}
            pending={save.isPending}
            onSave={(next) => save.mutateAsync(next.map((row) => ({ holiday_on: row.holiday_on, name: row.name })))}
          />
        )}
      </EntityDetailPanel>
    </div>
  );
}

"use client";

import { Button, FieldLabel, toast } from "@bokdy/ui";
import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { softDirectoryPrimaryBtn } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { PopoverCommandMultiSelect } from "@/components/popover-command-multi-select";
import {
  useAmenityCatalog,
  useBranchAmenityIds,
  usePutBranchAmenities,
} from "@/hooks/use-amenities";
import { amenityLabel } from "@/lib/api/amenities";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((id) => b.includes(id));
}

export function BranchAmenitiesView() {
  const t = useTranslations("organization.branchDetail.amenities");
  const te = useTranslations("errors");
  const locale = useLocale();
  const { organizationId, branchId } = useBranchDetail();
  const catalog = useAmenityCatalog();
  const saved = useBranchAmenityIds(organizationId, branchId);
  const put = usePutBranchAmenities(organizationId, branchId);
  // null = untouched; mirror server state until the user edits.
  const [draft, setDraft] = useState<string[] | null>(null);

  const savedIds = saved.data ?? [];
  const selected = draft ?? savedIds;
  const dirty = draft !== null && !sameSet(draft, savedIds);

  const options = (catalog.data ?? [])
    .filter((amenity) => amenity.is_active !== false || selected.includes(amenity.id))
    .map((amenity) => ({
      value: amenity.id,
      label: amenityLabel(amenity, locale),
      keywords: `${amenity.code} ${amenity.name_en} ${amenity.name_vi}`,
    }));

  const loading = catalog.isLoading || saved.isLoading;
  const failed = catalog.isError || saved.isError;

  async function onSave() {
    try {
      await put.mutateAsync(selected);
      setDraft(null);
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : t("loadError"));
    }
  }

  return (
    <BranchTabBody>
      <EntityDetailPanel
        title={t("title")}
        icon={<Sparkles className="size-4" aria-hidden />}
        tone="rose"
      >
        {loading ? (
          <BranchTabLoading />
        ) : failed ? (
          <BranchTabError
            message={t("loadError")}
            onRetry={() => {
              void catalog.refetch();
              void saved.refetch();
            }}
            retryDisabled={catalog.isFetching || saved.isFetching}
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel>{t("label")}</FieldLabel>
              <PopoverCommandMultiSelect
                value={selected}
                options={options}
                searchable
                placeholder={t("placeholder")}
                emptyText={t("emptyCatalog")}
                aria-label={t("label")}
                className="w-full bg-background"
                onValueChange={setDraft}
              />
              <p className="text-xs text-muted-foreground">{t("hint")}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="lg"
                className={softDirectoryPrimaryBtn}
                disabled={!dirty || put.isPending}
                onClick={() => void onSave()}
              >
                {t("save")}
              </Button>
            </div>
          </div>
        )}
      </EntityDetailPanel>
    </BranchTabBody>
  );
}

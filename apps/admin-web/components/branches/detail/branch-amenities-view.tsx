"use client";

import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftChip } from "@/components/entity/soft-chip";
import { useAmenityCatalog, useBranchAmenityIds } from "@/hooks/use-amenities";
import { amenityLabel } from "@/lib/api/amenities";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabError, BranchTabLoading } from "./branch-tab-state";

export function BranchAmenitiesView() {
  const t = useTranslations("organization.branchDetail.amenities");
  const tb = useTranslations("organization.branch");
  const locale = useLocale();
  const { organizationId, branchId } = useBranchDetail();
  const catalog = useAmenityCatalog();
  const saved = useBranchAmenityIds(organizationId, branchId);

  const savedIds = saved.data ?? [];
  const names = savedIds.map((id) => {
    const amenity = catalog.data?.find((item) => item.id === id);
    return amenity ? amenityLabel(amenity, locale) : id;
  });

  const loading = catalog.isLoading || saved.isLoading;
  const failed = catalog.isError || saved.isError;

  return (
    <EntityDetailPanel
      title={t("title")}
      hint={t("hint")}
      icon={<Sparkles className="size-4" aria-hidden />}
      tone="rose"
      className="h-full"
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
      ) : names.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {names.map((name) => (
            <SoftChip key={name} label={name} tone="rose" />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{tb("emptyValue")}</p>
      )}
    </EntityDetailPanel>
  );
}

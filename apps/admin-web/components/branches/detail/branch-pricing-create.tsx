"use client";

import { useLocale, useTranslations } from "next-intl";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { DataListEmpty } from "@/components/data-list";
import { useBranchPricingProfiles } from "@/hooks/use-pricing";
import { useSports } from "@/hooks/use-sports";
import { useRouter } from "@/i18n/navigation";

import { useBranchDetail } from "./branch-detail-context";
import { BranchPricingForm } from "./branch-pricing-form";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

export function BranchPricingCreateView({ sportId }: { sportId: string }) {
  const t = useTranslations("organization.branchDetail.pricing");
  const locale = useLocale();
  const router = useRouter();
  const { organizationId, branchId } = useBranchDetail();
  const profiles = useBranchPricingProfiles(organizationId, branchId);
  const { data: sports = [] } = useSports();
  const sportOptions = (profiles.data ?? []).map((group) => {
    const sport = sports.find((item) => item.id === group.sport_id);
    return {
      id: group.sport_id,
      label: sport ? sportLabel(sport, locale) : group.sport_id,
      suggestedBase: group.suggested_base_amount ?? null,
    };
  });
  const selected = sportOptions.find((option) => option.id === sportId);

  return (
    <BranchTabBody>
      {profiles.isLoading ? (
        <BranchTabLoading />
      ) : profiles.isError ? (
        <BranchTabError
          message={t("loadError")}
          onRetry={() => {
            void profiles.refetch();
          }}
          retryDisabled={profiles.isFetching}
        />
      ) : sportOptions.length === 0 ? (
        <DataListEmpty title={t("emptySports")} className="py-10" />
      ) : (
        <BranchPricingForm
          organizationId={organizationId}
          branchId={branchId}
          sportOptions={sportOptions}
          initialSportId={selected?.id ?? ""}
          suggestedBase={selected?.suggestedBase}
          onDone={() => router.push(`/branches/${branchId}/pricing`)}
          onSaved={(profile) => router.push(`/pricing-profiles/${profile.id}`)}
        />
      )}
    </BranchTabBody>
  );
}

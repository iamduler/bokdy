"use client";

import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  toast,
} from "@bokdy/ui";
import { BadgeCheck, Copy, FilePen, Pencil, Plus, Search, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { DataListEmpty, DataListStats, softDirectoryPrimaryBtn } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { PRICING_STATUS_TONE, pricingStatusKey } from "@/components/pricing-profiles/pricing-status";
import { useBranchPricingProfiles, useDuplicateBranchPricing } from "@/hooks/use-pricing";
import { useSports } from "@/hooks/use-sports";
import { Link, useRouter } from "@/i18n/navigation";
import type { BranchPricingProfile } from "@/lib/api/pricing";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { CUSTOMER_TYPES } from "@/lib/validation/branch-pricing";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

function formatAmount(locale: string, amount: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

type Filter = "all" | "walk_in" | "member" | "vip" | "active" | "draft";

const FILTERS = ["all", ...CUSTOMER_TYPES, "active", "draft"] as const;

export function BranchPricingView() {
  const t = useTranslations("organization.branchDetail.pricing");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const { organizationId, branchId } = useBranchDetail();
  const profiles = useBranchPricingProfiles(organizationId, branchId);
  const duplicate = useDuplicateBranchPricing(organizationId, branchId);
  const { data: sports = [] } = useSports();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => {
    const all = (profiles.data ?? []).flatMap((group) => group.profiles);
    const needle = query.trim().toLowerCase();
    return all.filter((profile) => {
      const status = pricingStatusKey(profile);
      if (filter === "walk_in" || filter === "member" || filter === "vip") {
        if (profile.customer_type !== filter) return false;
      }
      if (filter === "active" && status !== "activeBadge" && status !== "activeDraft") return false;
      if (filter === "draft" && status !== "draft") return false;
      if (!needle) return true;
      return profile.name.toLowerCase().includes(needle) || profile.code.toLowerCase().includes(needle);
    });
  }, [filter, profiles.data, query]);
  const allProfiles = (profiles.data ?? []).flatMap((group) => group.profiles);
  const published = allProfiles.filter((profile) => profile.published).length;
  const drafts = allProfiles.filter((profile) => pricingStatusKey(profile) === "draft").length;
  const stats = useMemo(
    () => [
      {
        key: "total",
        label: t("statTotal"),
        value: allProfiles.length,
        icon: <Wallet className="size-4" aria-hidden />,
        iconTone: "sky" as const,
      },
      {
        key: "active",
        label: t("statActive"),
        value: published,
        icon: <BadgeCheck className="size-4" aria-hidden />,
        iconTone: "emerald" as const,
      },
      {
        key: "draft",
        label: t("statDraft"),
        value: drafts,
        icon: <FilePen className="size-4" aria-hidden />,
        iconTone: "amber" as const,
      },
    ],
    [allProfiles.length, drafts, published, t],
  );

  async function onDuplicate(profileId: string) {
    try {
      const copy = await duplicate.mutateAsync(profileId);
      toast.success(t("duplicated"));
      router.push(`/pricing-profiles/${copy.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : t("loadError"));
    }
  }

  return (
    <BranchTabBody>
      <EntityDetailPanel
        title={t("title")}
        icon={<Wallet className="size-4" aria-hidden />}
        tone="sky"
        actions={
          <Button asChild size="sm" className={softDirectoryPrimaryBtn}>
            <Link href={`/branches/${branchId}/pricing/new`}>
              <Plus className="size-3.5" aria-hidden />
              {t("addList")}
            </Link>
          </Button>
        }
      >
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
        ) : (profiles.data ?? []).length === 0 ? (
          <DataListEmpty title={t("emptySports")} className="py-10" />
        ) : (
          <div className="space-y-4">
            <DataListStats items={stats} className="grid-cols-3 md:grid-cols-3" />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 overflow-x-auto soft-scrollbar">
                <div className="inline-flex w-max max-w-full items-center rounded-full border border-border/60 bg-card p-1 shadow-sm">
                  {FILTERS.map((item) => {
                    const selected = filter === item;
                    const label =
                      item === "all" || item === "active" || item === "draft"
                        ? t(`filter.${item}`)
                        : t(`audience.${item}`);
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setFilter(item)}
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                          selected
                            ? "bg-sky-500 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <InputGroup className="min-w-0 overflow-hidden rounded-full border-0 bg-muted/50 shadow-none md:w-60 has-[[data-slot=input-group-control]:focus-visible]:ring-1">
                <InputGroupInput
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  autoComplete="off"
                  aria-label={t("searchPlaceholder")}
                  className="rounded-full border-0 bg-transparent shadow-none"
                />
                <InputGroupAddon align="inline-start">
                  <Search aria-hidden />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colName")}</TableHead>
                  <TableHead>{t("customerType")}</TableHead>
                  <TableHead>{t("colPrice")}</TableHead>
                  <TableHead>{t("colSlot")}</TableHead>
                  <TableHead>{t("colRules")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      {t("emptyFilter")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((profile) => {
                    const sport = sports.find((item) => item.id === profile.sport_id);
                    return (
                      <ProfileRow
                        key={profile.id}
                        profile={profile}
                        sportName={sport ? sportLabel(sport, locale) : profile.sport_id}
                        locale={locale}
                        duplicating={duplicate.isPending}
                        onDuplicate={() => void onDuplicate(profile.id)}
                      />
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </EntityDetailPanel>
    </BranchTabBody>
  );
}

function ProfileRow({
  profile,
  sportName,
  locale,
  duplicating,
  onDuplicate,
}: {
  profile: BranchPricingProfile;
  sportName: string;
  locale: string;
  duplicating: boolean;
  onDuplicate: () => void;
}) {
  const t = useTranslations("organization.branchDetail.pricing");
  const status = pricingStatusKey(profile);
  const price =
    profile.base_amount == null
      ? t("emptyValue")
      : profile.base_amount === 0
        ? t("freePrice")
        : `${formatAmount(locale, profile.base_amount)} ${t("currencySuffix")}`;
  const groups = profile.day_groups?.length ?? 0;
  const windows = (profile.day_groups ?? []).reduce((sum, group) => sum + (group.windows?.length ?? 0), 0);
  const holidays = profile.holiday_windows?.length ?? 0;
  const rules =
    groups === 0 && windows === 0 && holidays === 0
      ? t("basePrice")
      : t("ruleCounts", { groups, windows, holidays });
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/pricing-profiles/${profile.id}`}
          className="block font-medium text-foreground outline-none focus-visible:underline"
        >
          {profile.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {profile.code} · {sportName}
        </p>
      </TableCell>
      <TableCell>{t(`audience.${profile.customer_type}`)}</TableCell>
      <TableCell>{price}</TableCell>
      <TableCell>{t("minutes", { count: profile.slot_unit_minutes })}</TableCell>
      <TableCell>{rules}</TableCell>
      <TableCell>
        {status === "activeDraft" ? (
          <div className="flex flex-wrap gap-1">
            <SoftStatusChip label={t("activeBadge")} tone="emerald" />
            <SoftStatusChip label={t("draft")} tone="amber" />
          </div>
        ) : (
          <SoftStatusChip label={t(status)} tone={PRICING_STATUS_TONE[status]} />
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="icon-sm" aria-label={t("edit")}>
            <Link href={`/pricing-profiles/${profile.id}/edit`}>
              <Pencil className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("duplicate")}
            disabled={duplicating}
            onClick={onDuplicate}
          >
            <Copy className="size-4" aria-hidden />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

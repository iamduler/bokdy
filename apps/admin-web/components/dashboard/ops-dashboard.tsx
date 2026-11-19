"use client";

import { Button } from "@bokdy/ui";
import { Building2, PauseCircle, PowerOff, Shield, ShieldCheck, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { DataListStats, type DataListStatItem } from "@/components/data-list";
import { organizationDirectoryStatsFromApi } from "@/components/organizations/organization-directory-stats";
import { EntitySectionHead } from "@/components/entity/section-head";
import { useOrganizationDirectoryStats } from "@/hooks/use-admin-organizations";
import { useAdminUserStats } from "@/hooks/use-admin-users";

export function OpsDashboard() {
  const t = useTranslations("shell.dashboardOps");
  const tOrg = useTranslations("organization");
  const tNav = useTranslations("shell.nav");
  const tc = useTranslations("common");
  const orgs = useOrganizationDirectoryStats({});
  const players = useAdminUserStats("players");
  const owners = useAdminUserStats("owners");
  const admins = useAdminUserStats("admins");
  const directory = organizationDirectoryStatsFromApi(orgs.data);

  const orgItems = useMemo<DataListStatItem[]>(
    () => [
      {
        key: "total",
        label: tOrg("directoryKpis.total"),
        value: directory.total,
        secondary: tOrg("directoryKpis.branchSecondary", { count: directory.branchTotal }),
        icon: <Building2 className="size-4" aria-hidden />,
        iconTone: "sky",
        href: "/organizations",
      },
      {
        key: "active",
        label: tOrg("directoryKpis.active"),
        value: directory.active,
        icon: <ShieldCheck className="size-4" aria-hidden />,
        iconTone: "emerald",
        href: "/organizations?status=active",
      },
      {
        key: "inactive",
        label: tOrg("directoryKpis.inactive"),
        value: directory.inactive,
        icon: <PowerOff className="size-4" aria-hidden />,
        iconTone: "amber",
        href: "/organizations?status=inactive",
      },
      {
        key: "suspended",
        label: tOrg("directoryKpis.suspended"),
        value: directory.suspended,
        icon: <PauseCircle className="size-4" aria-hidden />,
        iconTone: "rose",
        href: "/organizations?status=suspended",
      },
    ],
    [directory, tOrg],
  );

  const userItems = useMemo<DataListStatItem[]>(
    () => [
      {
        key: "players",
        label: tNav("usersPlayers"),
        value: players.data?.total ?? 0,
        secondary: t("activeSecondary", { count: players.data?.active ?? 0 }),
        icon: <Users className="size-4" aria-hidden />,
        iconTone: "sky",
        href: "/users/players",
      },
      {
        key: "owners",
        label: tNav("usersOwners"),
        value: owners.data?.total ?? 0,
        secondary: t("activeSecondary", { count: owners.data?.active ?? 0 }),
        icon: <UserRound className="size-4" aria-hidden />,
        iconTone: "emerald",
        href: "/users/owners",
      },
      {
        key: "admins",
        label: tNav("usersAdmins"),
        value: admins.data?.total ?? 0,
        secondary: t("activeSecondary", { count: admins.data?.active ?? 0 }),
        icon: <Shield className="size-4" aria-hidden />,
        iconTone: "amber",
        href: "/users/admins",
      },
    ],
    [admins.data, owners.data, players.data, t, tNav],
  );

  const usersLoading = players.isLoading || owners.isLoading || admins.isLoading;
  const usersError = players.isError || owners.isError || admins.isError;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <EntitySectionHead icon={<Building2 className="size-4" aria-hidden />} tone="sky">
          {t("organizations")}
        </EntitySectionHead>
        <DataListStats items={orgItems} isLoading={orgs.isLoading} />
        {orgs.isError ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void orgs.refetch()}
          >
            {tc("retry")}
          </Button>
        ) : null}
      </section>
      <section>
        <EntitySectionHead icon={<Users className="size-4" aria-hidden />} tone="emerald">
          {t("users")}
        </EntitySectionHead>
        <DataListStats items={userItems} isLoading={usersLoading} />
        {usersError ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              void players.refetch();
              void owners.refetch();
              void admins.refetch();
            }}
          >
            {tc("retry")}
          </Button>
        ) : null}
      </section>
    </div>
  );
}

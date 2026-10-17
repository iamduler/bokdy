"use client";

import {
  Badge,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bokdy/ui";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { EntitySectionHead } from "@/components/entity/section-head";
import { EntityUnavailableButton } from "@/components/entity/unavailable";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

const ROLE_TONES = [
  "text-violet-600 dark:text-violet-400 bg-violet-500/15",
  "text-primary bg-primary/15",
  "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15",
  "text-amber-600 dark:text-amber-400 bg-amber-500/15",
  "text-pink-600 dark:text-pink-400 bg-pink-500/15",
] as const;

export function OrganizationTeamView() {
  const t = useTranslations("organization.detailTeam");
  const tu = useTranslations("organization");
  const { org } = useOrganizationDetail();
  const pendingCount = DETAIL_MOCK.team.filter((m) => m.status === "pending").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        subtitle={t("subtitle", { count: DETAIL_MOCK.team.length, pending: pendingCount })}
        actions={
          <EntityUnavailableButton reason={tu("unavailable")} variant="default" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            {t("invite")}
          </EntityUnavailableButton>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="overflow-y-auto soft-scrollbar px-6 pb-6">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="hover:bg-transparent">
                {[t("colMember"), t("colRole"), t("colBranch"), t("colLastLogin"), t("colStatus"), ""].map(
                  (h) => (
                    <TableHead key={h || "actions"} className="text-[10.5px] uppercase tracking-wider">
                      {h}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DETAIL_MOCK.team.map((m, i) => (
                <TableRow key={m.name} className={i % 2 === 0 ? "bg-muted/20" : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          ROLE_TONES[i % ROLE_TONES.length],
                        )}
                      >
                        {m.initials}
                      </div>
                      <span className="text-[13px] font-bold">{m.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-bold",
                        ROLE_TONES[i % ROLE_TONES.length],
                      )}
                    >
                      {t(`roles.${m.roleKey}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.branch}</TableCell>
                  <TableCell className="whitespace-nowrap text-[11.5px] text-muted-foreground">
                    {m.lastLogin}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={m.status === "active" || m.status === "pending" ? "outline" : "secondary"}
                      className={
                        m.status === "active"
                          ? "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : m.status === "pending"
                            ? "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300"
                            : undefined
                      }
                    >
                      {t(`memberStatus.${m.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <EntityUnavailableButton
                        label={tu("view")}
                        reason={tu("unavailable")}
                        className="h-7 px-2 text-[11px]"
                      />
                      <EntityUnavailableButton
                        label={t("rolesAction")}
                        reason={tu("unavailable")}
                        className="h-7 px-2 text-[11px]"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="overflow-y-auto soft-scrollbar border-border p-4 lg:border-l">
          <EntitySectionHead>{t("roleDistribution")}</EntitySectionHead>
          {DETAIL_MOCK.roleDistribution.map((r, i) => (
            <div key={r.roleKey} className="mb-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">{t(`roles.${r.roleKey}`)}</span>
                <span className="font-bold text-primary">{r.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(r.count / DETAIL_MOCK.team.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  Badge,
  Button,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bokdy/ui";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { DetailSectionHead } from "../shared/detail-section-head";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

function UnavailableButton({ label }: { label: string }) {
  const t = useTranslations("organization");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" disabled>
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("unavailable")}</TooltipContent>
    </Tooltip>
  );
}

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
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button type="button" size="sm" className="h-8 gap-1 text-xs" disabled>
                  <Plus className="h-3.5 w-3.5" />
                  {t("invite")}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{tu("unavailable")}</TooltipContent>
          </Tooltip>
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
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
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
                      variant={
                        m.status === "active"
                          ? "success"
                          : m.status === "pending"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {t(`memberStatus.${m.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <UnavailableButton label={tu("view")} />
                      <UnavailableButton label={t("rolesAction")} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="overflow-y-auto soft-scrollbar border-border p-4 lg:border-l">
          <DetailSectionHead>{t("roleDistribution")}</DetailSectionHead>
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

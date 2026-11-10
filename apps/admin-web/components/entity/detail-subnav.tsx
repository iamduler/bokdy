"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI detail crumbs
 */

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  cn,
} from "@bokdy/ui";

import { Link } from "@/i18n/navigation";
import { Fragment } from "react";

type EntityDetailCrumb = {
  label: string;
  href?: string;
};

type EntityDetailPill = {
  id: string;
  href: string;
  label: string;
  active: boolean;
};

type EntityDetailSubnavProps = {
  root: { href: string; label: string; active?: boolean };
  crumbs: EntityDetailCrumb[];
  pills?: EntityDetailPill[];
};

export function EntityDetailSubnav({
  root,
  crumbs,
  pills = [],
}: EntityDetailSubnavProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-border/40 px-5 py-2.5 md:px-6">
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className={cn(root.active && "font-semibold text-foreground")}>
              <Link href={root.href}>{root.label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1 && !crumb.href;
            return (
              <Fragment key={`${crumb.label}-${index}`}>
                <BreadcrumbSeparator>›</BreadcrumbSeparator>
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className={cn(!isLast && "font-medium text-muted-foreground")}>
                      {crumb.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-1" />
      {pills.length > 0 ? (
        <div className="hidden items-center gap-1 sm:flex">
          {pills.map((pill) => (
            <Link
              key={pill.id}
              href={pill.href}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold transition-colors",
                pill.active
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {pill.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

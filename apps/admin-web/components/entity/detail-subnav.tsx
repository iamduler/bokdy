"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI detail crumbs
 */

import { cn } from "@bokdy/ui";

import { Link } from "@/i18n/navigation";

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
      <Link
        href={root.href}
        className={cn(
          "text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          root.active && "font-semibold text-foreground",
        )}
      >
        {root.label}
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1 && !crumb.href;
        return (
          <span
            key={`${crumb.label}-${index}`}
            className="flex min-w-0 items-center gap-1.5"
          >
            <span className="text-xs text-muted-foreground/60">›</span>
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="truncate text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate text-xs",
                  isLast
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground",
                )}
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
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

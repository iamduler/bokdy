"use client";

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

export function EntityDetailSubnav({ root, crumbs, pills = [] }: EntityDetailSubnavProps) {
  return (
    <div className="flex h-[38px] shrink-0 items-center gap-1.5 border-b border-border px-5">
      <Link
        href={root.href}
        className={cn(
          "text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          root.active && "font-bold text-primary",
        )}
      >
        {root.label}
      </Link>
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
          <span className="text-xs text-muted-foreground/60">›</span>
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="truncate text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="truncate text-xs font-semibold text-primary">{crumb.label}</span>
          )}
        </span>
      ))}
      <div className="flex-1" />
      {pills.length > 0 ? (
        <div className="hidden items-center gap-1 sm:flex">
          {pills.map((pill) => (
            <Link
              key={pill.id}
              href={pill.href}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10.5px] font-semibold transition-colors",
                pill.active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
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

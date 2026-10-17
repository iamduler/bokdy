"use client";

import { Button } from "@bokdy/ui";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

type EntityIdentityHeaderProps = {
  backHref: string;
  backLabel: string;
  avatar: ReactNode;
  title: string;
  badges?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
};

export function EntityIdentityHeader({
  backHref,
  backLabel,
  avatar,
  title,
  badges,
  meta,
  actions,
}: EntityIdentityHeaderProps) {
  return (
    <div className="shrink-0 px-6 pt-3.5">
      <div className="mb-3 flex flex-wrap items-center gap-3.5">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {badges}
          </div>
          {meta}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

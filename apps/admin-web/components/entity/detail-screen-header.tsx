"use client";

import { Button, cn } from "@bokdy/ui";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

type EntityDetailScreenHeaderProps = {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function EntityDetailScreenHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  actions,
  className,
}: EntityDetailScreenHeaderProps) {
  return (
    <div className={cn("flex shrink-0 flex-wrap items-center gap-3.5 border-b border-border px-6 py-3", className)}>
      <Button asChild variant="ghost" size="sm" className="h-8 w-8 px-0 text-muted-foreground">
        <Link href={backHref} aria-label={backLabel}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

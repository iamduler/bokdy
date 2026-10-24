"use client";

import { Button, cn } from "@bokdy/ui";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { usePageShellLeading } from "@/components/shell/shell-title";
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
  const back = usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link href={backHref} aria-label={backLabel}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  return (
    <>
      {back}
      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center gap-3.5 border-b border-border/40 px-6 py-4",
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </>
  );
}

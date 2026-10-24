"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI identity
 */

import { Button } from "@bokdy/ui";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { usePageShellLeading } from "@/components/shell/shell-title";
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
      <div className="shrink-0 px-5 pt-5 md:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          {avatar}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {badges}
            </div>
            {meta}
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </>
  );
}

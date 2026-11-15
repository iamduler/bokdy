"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import { softDetailSectionGap } from "@/components/data-list";
import { EntityDetailScreenHeader } from "@/components/entity/detail-screen-header";

type EntityDetailSectionFrameProps = {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  hint?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

/** Title, optional filter row, and scrolling body for a detail section. */
export function EntityDetailSectionFrame({
  backHref,
  backLabel,
  title,
  subtitle,
  hint,
  actions,
  toolbar,
  children,
}: EntityDetailSectionFrameProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <EntityDetailScreenHeader
        backHref={backHref}
        backLabel={backLabel}
        title={title}
        subtitle={subtitle}
        hint={hint}
        actions={actions}
      />
      {toolbar ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/40 px-4 py-3 md:px-6">
          {toolbar}
        </div>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto soft-scrollbar p-4 pb-6 md:px-6",
          softDetailSectionGap,
        )}
      >
        {children}
      </div>
    </div>
  );
}

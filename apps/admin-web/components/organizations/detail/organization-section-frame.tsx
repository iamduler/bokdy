"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import { softDetailSectionGap } from "@/components/data-list";

import { OrganizationDetailScreenHeader } from "./organization-detail-screen-header";

type OrganizationSectionFrameProps = {
  title: string;
  subtitle?: string;
  hint?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

/** Shared chrome for organization detail sections: title, optional toolbar, scrolling body. */
export function OrganizationSectionFrame({
  title,
  subtitle,
  hint,
  actions,
  toolbar,
  children,
}: OrganizationSectionFrameProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
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

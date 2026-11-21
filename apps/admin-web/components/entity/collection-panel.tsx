"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import type { SoftIconToneKey } from "@/components/entity/soft-icon-chip";

/** Card chrome for an entity collection: title, filter slot, body, and pager. */
export function EntityCollectionPanel({
  title,
  icon,
  tone,
  hint,
  actions,
  toolbar,
  pagination,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  tone?: SoftIconToneKey;
  hint?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  pagination?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <EntityDetailPanel
      title={title}
      icon={icon}
      tone={tone}
      hint={hint}
      actions={actions}
      className={className}
    >
      {toolbar ? (
        <div className={cn("mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center")}>
          {toolbar}
        </div>
      ) : null}
      {children}
      {pagination ? <div className="mt-4">{pagination}</div> : null}
    </EntityDetailPanel>
  );
}

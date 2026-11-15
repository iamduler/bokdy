"use client";

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
}: {
  title: string;
  icon?: ReactNode;
  tone?: SoftIconToneKey;
  hint?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  pagination?: ReactNode;
  children: ReactNode;
}) {
  return (
    <EntityDetailPanel title={title} icon={icon} tone={tone} hint={hint} actions={actions}>
      {toolbar ? <div className="mb-4 flex flex-wrap items-center gap-2">{toolbar}</div> : null}
      {children}
      {pagination ? <div className="mt-4">{pagination}</div> : null}
    </EntityDetailPanel>
  );
}

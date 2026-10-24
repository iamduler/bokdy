/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI detail panel
 */

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import { EntitySectionHead } from "@/components/entity/section-head";
import type { SoftIconToneKey } from "@/components/entity/soft-icon-chip";

export function EntityDetailPanel({
  title,
  icon,
  tone,
  actions,
  children,
  className,
}: {
  title?: string;
  icon?: ReactNode;
  tone?: SoftIconToneKey;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "soft-elevated rounded-2xl border-0 p-5",
        className,
      )}
    >
      {title ? (
        <EntitySectionHead icon={icon} tone={tone} actions={actions}>
          {title}
        </EntitySectionHead>
      ) : null}
      {children}
    </div>
  );
}

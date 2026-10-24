"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import {
  SoftIconChip,
  type SoftIconToneKey,
} from "@/components/entity/soft-icon-chip";

type EntitySectionHeadProps = {
  children: ReactNode;
  icon?: ReactNode;
  tone?: SoftIconToneKey;
  actions?: ReactNode;
  className?: string;
};

/** Soft UI block title — optional icon chip beside semibold label. */
export function EntitySectionHead({
  children,
  icon,
  tone = "sky",
  actions,
  className,
}: EntitySectionHeadProps) {
  return (
    <div
      className={cn(
        "mb-4 flex min-w-0 items-center gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {icon ? <SoftIconChip icon={icon} tone={tone} /> : null}
        <h3 className="truncate text-base font-semibold text-foreground">
          {children}
        </h3>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

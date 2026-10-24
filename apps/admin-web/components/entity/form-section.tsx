"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import { EntitySectionHead } from "@/components/entity/section-head";
import type { SoftIconToneKey } from "@/components/entity/soft-icon-chip";

export const entityFormSectionClass =
  "soft-elevated mb-2 space-y-3 rounded-2xl border-0 p-4 md:mb-4 [&_input]:bg-white dark:[&_input]:bg-background";

export const entityFormFieldsClass = "grid grid-cols-1 gap-4 sm:grid-cols-2";

export function EntityFormSection({
  title,
  icon,
  tone,
  children,
  className,
}: {
  title?: string;
  icon?: ReactNode;
  tone?: SoftIconToneKey;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(entityFormSectionClass, className)}>
      {title ? (
        <EntitySectionHead icon={icon} tone={tone} className="mb-1">
          {title}
        </EntitySectionHead>
      ) : null}
      {children}
    </section>
  );
}

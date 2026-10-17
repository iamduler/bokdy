import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import { EntitySectionHead } from "@/components/entity/section-head";

export function EntityDetailPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-card p-4", className)}>
      {title ? <EntitySectionHead>{title}</EntitySectionHead> : null}
      {children}
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@bokdy/ui";

import { DetailSectionHead } from "./detail-section-head";

export function DetailPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/40 p-4", className)}>
      {title ? <DetailSectionHead>{title}</DetailSectionHead> : null}
      {children}
    </div>
  );
}

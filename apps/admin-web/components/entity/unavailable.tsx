"use client";

import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@bokdy/ui";
import type { ReactNode } from "react";

export function EntityUnavailableBadge({ label }: { label: string }) {
  return <Badge variant="outline">{label}</Badge>;
}

export function EntityUnavailable({
  reason,
  children,
  className,
}: {
  reason: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex", className)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

export function EntityUnavailableButton({
  label,
  reason,
  className,
  children,
  variant = "outline",
}: {
  label?: string;
  reason: string;
  className?: string;
  children?: ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <EntityUnavailable reason={reason}>
      <Button type="button" variant={variant} size="sm" className={cn("h-8 text-xs", className)} disabled>
        {children ?? label}
      </Button>
    </EntityUnavailable>
  );
}

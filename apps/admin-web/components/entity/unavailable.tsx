"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@bokdy/ui";
import type { ReactNode } from "react";

/** Soft UI muted chip (Vessa channel-style). */
export function EntityUnavailableBadge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
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

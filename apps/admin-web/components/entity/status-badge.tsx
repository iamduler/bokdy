import { Badge, cn } from "@bokdy/ui";
import type { ComponentProps } from "react";

type EntityStatusBadgeProps = {
  label: string;
  className?: string;
  variant?: ComponentProps<typeof Badge>["variant"];
};

export function EntityStatusBadge({ label, className, variant }: EntityStatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn(className)}>
      {label}
    </Badge>
  );
}

"use client";

import { Button, cn } from "@bokdy/ui";
import type { ReactNode } from "react";

export function StatusActionButton({
  label,
  pending,
  error,
  success,
  onClick,
  className,
}: {
  label: string;
  pending?: boolean;
  error?: string | null;
  success?: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <div className="space-y-2">
      <Button type="button" size="sm" className={cn(className)} onClick={onClick} disabled={pending}>
        {label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
    </div>
  );
}

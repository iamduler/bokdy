"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { DataTableSkeleton } from "@/components/data-list";

export function BranchTabLoading() {
  return <DataTableSkeleton rows={4} columns={4} className="px-0" />;
}

export function BranchTabError({
  message,
  onRetry,
  retryDisabled,
}: {
  message: string;
  onRetry?: () => void;
  retryDisabled?: boolean;
}) {
  const tc = useTranslations("common");
  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="lg" onClick={onRetry} disabled={retryDisabled}>
          {tc("retry")}
        </Button>
      ) : null}
    </div>
  );
}

/** Wrapper shared by every branch tab body (scrolls inside the layout). */
export function BranchTabBody({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 p-5 pt-2 md:gap-5 md:px-6">{children}</div>;
}

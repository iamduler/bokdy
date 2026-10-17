"use client";

import { Button } from "@bokdy/ui";

import { Link } from "@/i18n/navigation";

const backClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-primary hover:text-primary-foreground";

export function EntityDetailLoading({ label }: { label: string }) {
  return <p className="p-4 text-sm text-muted-foreground md:p-6">{label}</p>;
}

export function EntityDetailError({
  message,
  notFound,
  retryLabel,
  onRetry,
  retryDisabled,
  backHref,
  backLabel,
}: {
  message: string;
  notFound: boolean;
  retryLabel: string;
  onRetry: () => void;
  retryDisabled?: boolean;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="m-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:m-6">
      <p className="text-sm text-destructive">{message}</p>
      <div className="flex flex-wrap gap-2">
        {!notFound ? (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={retryDisabled}>
            {retryLabel}
          </Button>
        ) : null}
        <Link href={backHref} className={backClass}>
          ← {backLabel}
        </Link>
      </div>
    </div>
  );
}

"use client";

import { Button, cn } from "@bokdy/ui";

type DataTablePaginationSummary = {
  from: number;
  to: number;
  total: number;
  page: number;
  pageCount: number;
};

type DataTablePaginationProps = {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  totalRows: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  labels: {
    previous: string;
    next: string;
    summary: (params: DataTablePaginationSummary) => string;
  };
  className?: string;
};

export function DataTablePagination({
  pageIndex,
  pageCount,
  pageSize,
  totalRows,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  labels,
  className,
}: DataTablePaginationProps) {
  if (totalRows === 0) return null;

  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);
  const summary = labels.summary({
    from,
    to,
    total: totalRows,
    page: pageIndex + 1,
    pageCount: Math.max(pageCount, 1),
  });

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-2.5 md:px-6",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{summary}</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPreviousPage}
          onClick={onPreviousPage}
        >
          {labels.previous}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNextPage}
          onClick={onNextPage}
        >
          {labels.next}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, cn } from "@bokdy/ui";

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
  const safePageCount = Math.max(pageCount, 1);
  const summary = labels.summary({
    from,
    to,
    total: totalRows,
    page: pageIndex + 1,
    pageCount: safePageCount,
  });

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-t border-border/40 bg-card px-4 py-3 md:px-6",
        className,
      )}
    >
      <p className="min-w-0 truncate text-sm text-muted-foreground">{summary}</p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className="h-8 rounded-full border-border/60 bg-background px-2.5 shadow-none"
              disabled={!canPreviousPage}
              onClick={onPreviousPage}
              aria-label={labels.previous}
            >
              <span className="hidden sm:inline">{labels.previous}</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <span className="min-w-10 rounded-full bg-muted/60 px-2.5 py-1 text-center text-xs font-medium tabular-nums text-foreground">
              {pageIndex + 1}/{safePageCount}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className="h-8 rounded-full border-border/60 bg-background px-2.5 shadow-none"
              disabled={!canNextPage}
              onClick={onNextPage}
              aria-label={labels.next}
            >
              <span className="hidden sm:inline">{labels.next}</span>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

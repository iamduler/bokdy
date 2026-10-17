"use client";

import {
  Button,
  ButtonGroup,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@bokdy/ui";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnResizeMode,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Eye,
  Pencil,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  DataListEmpty,
  DataTableSkeleton,
} from "@/components/data-list/data-list-empty";
import { DataTablePagination } from "@/components/data-list/data-table-pagination";
import { Link } from "@/i18n/navigation";

export type DataTableRowAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId: (row: TData) => string;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageSize?: number;
  paginationLabels: {
    previous: string;
    next: string;
    summary: (params: {
      from: number;
      to: number;
      total: number;
      page: number;
      pageCount: number;
    }) => string;
  };
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
  enableColumnResizing?: boolean;
  /** Optional mobile card list (shown below md). */
  mobileList?: ReactNode;
};

/**
 * Reusable TanStack table: selection, sort, optional column resize, skeleton/empty.
 * Header text is sentence case (no uppercase tracking).
 */
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  pagination,
  onPaginationChange,
  pageSize = 20,
  paginationLabels,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  retryLabel,
  emptyTitle,
  emptyDescription,
  emptyAction,
  className,
  enableColumnResizing = true,
  mobileList,
}: DataTableProps<TData>) {
  const columnResizeMode: ColumnResizeMode = "onChange";

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange,
    onRowSelectionChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => getRowId(row),
    enableRowSelection: true,
    enableColumnResizing,
    columnResizeMode,
    defaultColumn: {
      minSize: 60,
      size: 140,
      maxSize: 480,
    },
  });

  if (isLoading) {
    return <DataTableSkeleton columns={Math.min(columns.length, 7)} />;
  }

  if (isError) {
    return (
      <DataListEmpty
        title={errorMessage ?? "Error"}
        action={
          onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {retryLabel ?? "Retry"}
            </Button>
          ) : null
        }
      />
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {mobileList ? <div className="md:hidden">{mobileList}</div> : null}

      <div
        className={cn(
          "min-h-0 flex-1 overflow-auto soft-scrollbar",
          mobileList && "hidden md:block",
        )}
      >
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="group relative"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex max-w-full cursor-pointer items-center gap-1 truncate text-left select-none hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted === "asc" ? (
                            <ArrowUp className="h-3 w-3 shrink-0" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="h-3 w-3 shrink-0" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex max-w-full items-center truncate">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                      )}
                      {header.column.getCanResize() ? (
                        <div
                          onDoubleClick={() => header.column.resetSize()}
                          onPointerDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute top-0 -right-1 z-10 flex h-full w-2 cursor-col-resize touch-none items-stretch justify-center select-none"
                        >
                          <span
                            className={cn(
                              "w-px bg-transparent group-hover:bg-border",
                              header.column.getIsResizing() && "bg-primary",
                            )}
                          />
                        </div>
                      ) : null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={
                        cell.column.id === "actions" ? undefined : "truncate"
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2 py-6">
                    <p className="text-sm font-medium">{emptyTitle}</p>
                    {emptyDescription ? (
                      <p className="text-sm text-muted-foreground">
                        {emptyDescription}
                      </p>
                    ) : null}
                    {emptyAction}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        pageIndex={table.getState().pagination.pageIndex}
        pageCount={table.getPageCount()}
        pageSize={pageSize}
        totalRows={data.length}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        onPreviousPage={() => table.previousPage()}
        onNextPage={() => table.nextPage()}
        labels={paginationLabels}
      />
    </div>
  );
}

/** Select-all / row checkbox column helper. */
export function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    size: 40,
    minSize: 40,
    maxSize: 40,
    enableSorting: false,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
  };
}

type DataTableRowActionsProps = {
  viewHref: string;
  viewLabel: string;
  editLabel: string;
  editHref?: string;
  editDisabledReason?: string;
  moreLabel: string;
  moreActions?: DataTableRowAction[];
};

export function DataTableRowActions({
  viewHref,
  viewLabel,
  editLabel,
  editHref,
  editDisabledReason,
  moreLabel,
  moreActions = [],
}: DataTableRowActionsProps) {
  const hasMore = moreActions.length > 0;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ButtonGroup onClick={(event) => event.stopPropagation()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="outline"
            size="icon-sm"
            className="rounded-r-none"
            aria-label={viewLabel}
          >
            <Link href={viewHref}>
              <Eye />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{viewLabel}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          {editHref ? (
            <Button
              asChild
              variant="outline"
              size="icon-sm"
              aria-label={editLabel}
              className={cn(
                "rounded-l-none border-l-0",
                hasMore ? "rounded-r-none" : "rounded-r-md",
              )}
            >
              <Link href={editHref}>
                <Pencil />
              </Link>
            </Button>
          ) : (
            <span className="contents">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled
                aria-label={editLabel}
                className={cn(
                  "rounded-l-none border-l-0",
                  hasMore ? "rounded-r-none" : "rounded-r-md",
                )}
              >
                <Pencil />
              </Button>
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>
          {editHref ? editLabel : (editDisabledReason ?? editLabel)}
        </TooltipContent>
      </Tooltip>

      {hasMore ? (
        <DropdownMenu
          modal={false}
          open={menuOpen}
          onOpenChange={(next) => {
            if (next) setMenuOpen(true);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={moreLabel}
              className="rounded-l-none border-l-0"
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-36"
            onPointerDownOutside={(event) => event.preventDefault()}
            onFocusOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {moreActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                disabled={action.disabled}
                variant={action.destructive ? "destructive" : "default"}
                onSelect={(event) => {
                  event.preventDefault();
                  if (action.disabled) return;
                  action.onSelect();
                  setMenuOpen(false);
                }}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </ButtonGroup>
  );
}

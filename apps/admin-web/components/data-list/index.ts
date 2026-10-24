export { DataListStats, type DataListStatItem } from "./data-list-stats";
export {
  DataListLayout,
  type DataListStatusTab,
} from "./data-list-layout";
export { DataListEmpty, DataTableSkeleton } from "./data-list-empty";
export {
  DataTable,
  DataTableRowActions,
  createSelectionColumn,
  type DataTableRowAction,
} from "./data-table";
export { DataTablePagination } from "./data-table-pagination";

export const DATA_LIST_PAGE_SIZE = 20;

/** Soft UI title-row primary CTA (sky fill + soft-cta shadow). */
export const softDirectoryPrimaryBtn =
  "soft-btn-primary h-11 gap-2 rounded-xl text-sm font-semibold";

/** Soft UI title-row secondary CTA (white surface + light shadow). */
export const softDirectorySecondaryBtn =
  "soft-btn-secondary h-11 gap-2 rounded-xl border border-border/60 bg-card text-sm font-semibold text-foreground shadow-none hover:bg-muted/40";

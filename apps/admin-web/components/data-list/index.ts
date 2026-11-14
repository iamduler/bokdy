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

/** Soft UI content column max width (detail / profile / dashboard). */
export const softContentMaxW = "max-w-5xl";

/** Soft UI title-row primary CTA (sky fill + soft-cta shadow). */
export const softDirectoryPrimaryBtn =
  "soft-btn-primary h-11 gap-2 rounded-xl text-sm font-semibold";

/** Soft UI title-row secondary CTA (white surface + light shadow). */
export const softDirectorySecondaryBtn =
  "soft-btn-secondary h-11 gap-2 rounded-xl border border-border/60 bg-card text-sm font-semibold text-foreground shadow-none hover:border-sky-400 hover:bg-sky-500 hover:text-white";

/** Soft UI compact icon action beside detail field values (edit / resend / …). */
export const softFieldIconBtn =
  "size-7 shrink-0 rounded-lg text-muted-foreground shadow-none hover:bg-muted hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5";

/** Soft UI compact text action for empty detail fields (Add email / Add phone). */
export const softFieldSecondaryBtn =
  "soft-btn-secondary h-8 gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 text-xs font-medium text-foreground shadow-none hover:border-sky-400 hover:bg-sky-500 hover:text-white";

export { DataListStats, type DataListStatItem } from "./data-list-stats";
export {
  DataListLayout,
  type DataListLayoutProps,
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

/** Single Soft UI content column max width (auth / detail / profile / dashboard / lists). */
export const softContentMaxW = "max-w-5xl";

/** Vertical gap between Soft detail sections (hero ↔ panels, panel ↔ panel / grid). */
export const softDetailSectionGap = "gap-4 md:gap-5";

/** Detail-tab page inset. Cards inside carry their own padding. */
export const softDetailTabBody = "px-0 pt-1 pb-3 md:px-6 md:pt-2";

/** Detail collection card padding. */
export const softDetailPanelPad = "p-3 md:p-5";

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

/**
 * Search and filter fields on the warm light canvas.
 * Opaque card, a solid edge, and a short shadow so they stay readable on the wash.
 */
export const softFilterControl =
  "rounded-lg border border-shell-border-strong bg-shell-card text-foreground shadow-[var(--soft-shadow-bar)] hover:border-sky-400 hover:bg-shell-card hover:text-foreground";

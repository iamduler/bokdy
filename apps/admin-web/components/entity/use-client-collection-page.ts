"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { DATA_LIST_PAGE_SIZE } from "@/components/data-list";

/** Slice an already filtered list and expose DataTablePagination state. */
export function useClientCollectionPage<T>(items: T[], resetKey: string) {
  const t = useTranslations("dataList");
  const [pageIndex, setPageIndex] = useState(0);
  const [seenKey, setSeenKey] = useState(resetKey);

  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setPageIndex(0);
  }

  const pageCount = Math.max(1, Math.ceil(items.length / DATA_LIST_PAGE_SIZE));
  const index = Math.min(pageIndex, pageCount - 1);
  const start = index * DATA_LIST_PAGE_SIZE;

  return {
    pageItems: items.slice(start, start + DATA_LIST_PAGE_SIZE),
    pagination: {
      pageIndex: index,
      pageCount,
      pageSize: DATA_LIST_PAGE_SIZE,
      totalRows: items.length,
      canPreviousPage: index > 0,
      canNextPage: index + 1 < pageCount,
      onPreviousPage: () => setPageIndex((current) => Math.max(0, Math.min(current, pageCount - 1) - 1)),
      onNextPage: () => setPageIndex((current) => Math.min(pageCount - 1, current + 1)),
      labels: {
        previous: t("previousPage"),
        next: t("nextPage"),
        summary: (params: {
          from: number;
          to: number;
          total: number;
          page: number;
          pageCount: number;
        }) => t("pageSummary", params),
      },
    },
  };
}

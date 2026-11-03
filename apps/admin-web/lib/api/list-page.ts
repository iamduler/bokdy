export type ListPage<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type ListSortOrder = "asc" | "desc";

export type ListPageParams = {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: ListSortOrder;
};

export function appendListPageQuery(qs: URLSearchParams, params: ListPageParams) {
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null && params.offset > 0) qs.set("offset", String(params.offset));
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
}

export function readListPage(
  search: { get(name: string): string | null },
  pageSize: number,
) {
  const offsetRaw = Number(search.get("offset") ?? "0");
  const offset =
    Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;
  const pageIndex = Math.floor(offset / pageSize);
  const sort = search.get("sort")?.trim() ?? "";
  const orderRaw = search.get("order");
  const order: ListSortOrder | undefined =
    orderRaw === "asc" || orderRaw === "desc" ? orderRaw : undefined;
  return { offset: pageIndex * pageSize, pageIndex, sort, order };
}

export function sortingFromQuery(
  sort: string,
  order: ListSortOrder | undefined,
  columnBySort: Record<string, string>,
): { id: string; desc: boolean }[] {
  const id = columnBySort[sort];
  if (!id) return [];
  return [{ id, desc: order !== "asc" }];
}

export function queryFromSorting(
  sorting: { id: string; desc: boolean }[],
  sortByColumn: Record<string, string>,
): { sort?: string; order?: ListSortOrder } {
  const first = sorting[0];
  if (!first) return {};
  const sort = sortByColumn[first.id];
  if (!sort) return {};
  return { sort, order: first.desc ? "desc" : "asc" };
}

export function applySearchUpdates(
  current: { toString(): string },
  updates: Record<string, string | undefined>,
  resetOffset = false,
): string {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  if (resetOffset) params.delete("offset");
  if (params.get("offset") === "0") params.delete("offset");
  return params.toString();
}

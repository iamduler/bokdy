"use client";

import { createContext, useContext } from "react";

/** Soft entity form surface — drives field grid density. */
export type EntityFormLayout = "page" | "sheet";

const EntityFormLayoutContext = createContext<EntityFormLayout>("page");

export function EntityFormLayoutProvider({
  layout,
  children,
}: {
  layout: EntityFormLayout;
  children: React.ReactNode;
}) {
  return (
    <EntityFormLayoutContext.Provider value={layout}>
      {children}
    </EntityFormLayoutContext.Provider>
  );
}

export function useEntityFormLayout(): EntityFormLayout {
  return useContext(EntityFormLayoutContext);
}

/** Page: 1 → 2 → 3 cols. Sheet: always 2 fields per row. */
export function useEntityFormFieldsClass() {
  const layout = useEntityFormLayout();
  return layout === "sheet"
    ? "grid grid-cols-2 gap-4"
    : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
}

/** `span: 2` = full row in the active grid. */
export function useEntityFormFieldSpanClass(span?: 1 | 2) {
  const layout = useEntityFormLayout();
  if (span !== 2) return undefined;
  return layout === "sheet" ? "col-span-2" : "sm:col-span-2 lg:col-span-3";
}

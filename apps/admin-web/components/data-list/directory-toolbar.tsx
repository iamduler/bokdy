"use client";

import { Button } from "@bokdy/ui";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { softDirectoryPrimaryBtn } from "@/components/data-list";
import {
  DataListLayout,
  type DataListLayoutProps,
} from "@/components/data-list/data-list-layout";

type DirectoryToolbarProps = Omit<DataListLayoutProps, "primaryAction"> & {
  createLabel: string;
  onCreate: () => void;
};

/** Directory chrome: KPI row, status tabs, search, advanced filters, and a create button. */
export function DirectoryToolbar({
  createLabel,
  onCreate,
  children,
  ...layout
}: DirectoryToolbarProps) {
  return (
    <DataListLayout
      {...layout}
      primaryAction={
        <Button type="button" size="lg" className={softDirectoryPrimaryBtn} onClick={onCreate}>
          <Plus className="size-4" aria-hidden />
          {createLabel}
        </Button>
      }
    >
      {children}
    </DataListLayout>
  );
}

"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Branch } from "@/lib/api/branches";

type BranchDetailContextValue = {
  branch: Branch;
  organizationId: string;
  branchId: string;
};

const BranchDetailContext = createContext<BranchDetailContextValue | null>(null);

export function BranchDetailProvider({
  branch,
  organizationId,
  branchId,
  children,
}: BranchDetailContextValue & { children: ReactNode }) {
  return (
    <BranchDetailContext.Provider value={{ branch, organizationId, branchId }}>
      {children}
    </BranchDetailContext.Provider>
  );
}

export function useBranchDetail() {
  const ctx = useContext(BranchDetailContext);
  if (!ctx) {
    throw new Error("useBranchDetail must be used within BranchDetailProvider");
  }
  return ctx;
}

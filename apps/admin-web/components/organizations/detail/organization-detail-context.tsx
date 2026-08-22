"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AdminOrganization } from "@/lib/api/admin";

type OrganizationDetailContextValue = {
  org: AdminOrganization;
  orgId: string;
};

const OrganizationDetailContext = createContext<OrganizationDetailContextValue | null>(null);

export function OrganizationDetailProvider({
  org,
  orgId,
  children,
}: OrganizationDetailContextValue & { children: ReactNode }) {
  return (
    <OrganizationDetailContext.Provider value={{ org, orgId }}>
      {children}
    </OrganizationDetailContext.Provider>
  );
}

export function useOrganizationDetail() {
  const ctx = useContext(OrganizationDetailContext);
  if (!ctx) {
    throw new Error("useOrganizationDetail must be used within OrganizationDetailProvider");
  }
  return ctx;
}

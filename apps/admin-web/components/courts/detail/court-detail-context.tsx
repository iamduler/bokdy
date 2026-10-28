"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Court } from "@/lib/api/courts";

type CourtDetailContextValue = {
  court: Court;
  organizationId: string;
  courtId: string;
};

const CourtDetailContext = createContext<CourtDetailContextValue | null>(null);

export function CourtDetailProvider({
  court,
  organizationId,
  courtId,
  children,
}: CourtDetailContextValue & { children: ReactNode }) {
  return (
    <CourtDetailContext.Provider value={{ court, organizationId, courtId }}>
      {children}
    </CourtDetailContext.Provider>
  );
}

export function useCourtDetail() {
  const ctx = useContext(CourtDetailContext);
  if (!ctx) throw new Error("useCourtDetail requires CourtDetailProvider");
  return ctx;
}

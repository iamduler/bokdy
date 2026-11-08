"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { BranchPricingProfile } from "@/lib/api/pricing";

type PricingProfileDetail = {
  profile: BranchPricingProfile;
  organizationId: string;
  branchId: string;
};

const PricingProfileContext = createContext<PricingProfileDetail | null>(null);

export function PricingProfileProvider({
  value,
  children,
}: {
  value: PricingProfileDetail;
  children: ReactNode;
}) {
  return <PricingProfileContext.Provider value={value}>{children}</PricingProfileContext.Provider>;
}

export function usePricingProfileDetail() {
  const value = useContext(PricingProfileContext);
  if (!value) {
    throw new Error("usePricingProfileDetail must be used inside PricingProfileProvider");
  }
  return value;
}

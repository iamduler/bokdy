"use client";

import { useSearchParams } from "next/navigation";

import { BranchPricingCreateView } from "@/components/branches/detail/branch-pricing-create";

export default function NewBranchPricingPage() {
  const params = useSearchParams();
  return <BranchPricingCreateView sportId={params.get("sportId") ?? ""} />;
}

"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";

/** Overview is the default branch tab at `branches/[branchId]`. */
export default function BranchOverviewRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = typeof params.branchId === "string" ? params.branchId : "";

  useEffect(() => {
    if (branchId) router.replace(`/branches/${branchId}`);
  }, [branchId, router]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

/** Branch edit is sheet-only — redirect to branch detail. */
export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = typeof params.branchId === "string" ? params.branchId : "";

  useEffect(() => {
    if (branchId) router.replace(`/branches/${branchId}`);
  }, [branchId, router]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

/** Branch edit is sheet-only — redirect to branch detail. */
export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = typeof params.id === "string" ? params.id : "";
  const branchId = typeof params.branchId === "string" ? params.branchId : "";

  useEffect(() => {
    router.replace(`/organizations/${organizationId}/branches/${branchId}`);
  }, [organizationId, branchId, router]);

  return null;
}

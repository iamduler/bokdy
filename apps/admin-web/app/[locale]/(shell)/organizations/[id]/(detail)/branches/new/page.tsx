"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

/** Branch create is sheet-only — redirect away from full-page form. */
export default function NewBranchPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    router.replace(`/organizations/${organizationId}/branches`);
  }, [organizationId, router]);

  return null;
}

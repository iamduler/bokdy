"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { CourtForm } from "@/components/courts/court-form";
import { usePageShellTitle } from "@/components/shell/shell-title";

function NewOrganizationCourtForm() {
  const ts = useTranslations("shell");
  const params = useParams();
  const searchParams = useSearchParams();
  const organizationId = typeof params.id === "string" ? params.id : "";
  const branchParam = searchParams.get("branch");
  const fixedBranchId = branchParam?.trim() || undefined;
  usePageShellTitle(ts("pageTitles.courtCreate"));

  return (
    <div className="page-canvas">
      <CourtForm
        mode="create"
        layout="page"
        organizationId={organizationId}
        fixedBranchId={fixedBranchId}
      />
    </div>
  );
}

export default function NewOrganizationCourtPage() {
  return (
    <Suspense fallback={null}>
      <NewOrganizationCourtForm />
    </Suspense>
  );
}

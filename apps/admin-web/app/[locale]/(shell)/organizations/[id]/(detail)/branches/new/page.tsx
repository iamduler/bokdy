"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { BranchForm } from "@/components/organizations/detail/branches/branch-form";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function NewBranchPage() {
  const tb = useTranslations("organization.branch");
  usePageShellTitle(tb("createTitle"));
  const params = useParams();
  const organizationId = typeof params.id === "string" ? params.id : "";

  return (
    <div className="page-canvas min-h-0 flex-1 overflow-auto">
      <BranchForm mode="create" organizationId={organizationId} />
    </div>
  );
}

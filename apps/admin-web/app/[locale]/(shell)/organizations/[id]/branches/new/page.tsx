"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { BranchForm } from "@/components/branches/branch-form";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function NewBranchPage() {
  const ts = useTranslations("shell");
  const params = useParams();
  const organizationId = typeof params.id === "string" ? params.id : "";
  usePageShellTitle(ts("pageTitles.branchCreate"));

  return (
    <div className="page-canvas">
      <BranchForm mode="create" layout="page" organizationId={organizationId} />
    </div>
  );
}

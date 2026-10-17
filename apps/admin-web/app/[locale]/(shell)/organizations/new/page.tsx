"use client";

import { useTranslations } from "next-intl";

import { OrganizationForm } from "@/components/organizations/organization-form";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function NewOrganizationPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationCreate"));

  return (
    <div className="page-canvas">
      <OrganizationForm mode="create" />
    </div>
  );
}

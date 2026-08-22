"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { OrganizationDetail } from "@/components/organizations/organization-detail";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationDetailPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  return (
    <main className="flex min-h-full w-full flex-col">
      <OrganizationDetail id={id} />
    </main>
  );
}

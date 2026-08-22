"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { OrganizationDetail } from "@/components/organizations/organization-detail";
import { Link } from "@/i18n/navigation";

export default function OrganizationDetailPage() {
  const t = useTranslations("organization");
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <Link href="/organizations" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
        ← {t("backToList")}
      </Link>
      <OrganizationDetail id={id} />
    </main>
  );
}

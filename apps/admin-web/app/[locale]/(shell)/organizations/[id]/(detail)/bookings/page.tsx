"use client";

import { useTranslations } from "next-intl";

import { OrganizationBookingsView } from "@/components/organizations/detail/bookings/organization-bookings-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationBookingsPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));
  return <OrganizationBookingsView />;
}

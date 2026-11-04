"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { OrganizationBookingDetailView } from "@/components/organizations/detail/bookings/organization-booking-detail-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationBookingDetailPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));
  const params = useParams<{ bookingId: string }>();
  return <OrganizationBookingDetailView bookingId={params.bookingId} />;
}

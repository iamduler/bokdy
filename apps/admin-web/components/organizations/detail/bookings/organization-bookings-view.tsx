"use client";

import { useTranslations } from "next-intl";

import { AdminBookingListScreen } from "@/components/bookings/admin-booking-list-screen";
import { EntityDetailScreenHeader } from "@/components/entity/detail-screen-header";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";
import { useOrganizationBookings } from "@/hooks/use-admin-bookings";
import type { AdminBookingListParams } from "@/lib/api/admin-bookings";

function useOrganizationBookingList(params: AdminBookingListParams) {
  const { orgId } = useOrganizationDetail();
  return useOrganizationBookings(orgId, params);
}

export function OrganizationBookingsView() {
  const t = useTranslations("adminBookings");
  const tShell = useTranslations("shell");
  const { orgId } = useOrganizationDetail();
  return (
    <AdminBookingListScreen
      pathname={`/organizations/${orgId}/bookings`}
      useList={useOrganizationBookingList}
      header={(total) => (
        <EntityDetailScreenHeader
          backHref={`/organizations/${orgId}`}
          backLabel={tShell("menuBack")}
          title={t("orgTitle")}
          subtitle={t("orgSubtitle", { total })}
        />
      )}
    />
  );
}

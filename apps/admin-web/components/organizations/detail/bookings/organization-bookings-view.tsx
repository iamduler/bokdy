"use client";

import { AdminBookingListScreen } from "@/components/bookings/admin-booking-list-screen";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";
import { useOrganizationBookings } from "@/hooks/use-admin-bookings";
import type { AdminBookingListParams } from "@/lib/api/admin-bookings";

function useOrganizationBookingList(params: AdminBookingListParams) {
  const { orgId } = useOrganizationDetail();
  return useOrganizationBookings(orgId, params);
}

export function OrganizationBookingsView() {
  const { orgId } = useOrganizationDetail();
  return (
    <AdminBookingListScreen
      pathname={`/organizations/${orgId}/bookings`}
      useList={useOrganizationBookingList}
    />
  );
}

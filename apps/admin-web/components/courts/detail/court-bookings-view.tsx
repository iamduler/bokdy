"use client";

import { AdminBookingListScreen } from "@/components/bookings/admin-booking-list-screen";
import { useCourtDetail } from "@/components/courts/detail/court-detail-context";
import { courtDetailHref } from "@/components/courts/detail/court-detail-nav";
import { useAdminBookingDirectory } from "@/hooks/use-admin-bookings";
import type { AdminBookingListParams } from "@/lib/api/admin-bookings";

function useCourtBookingList(params: AdminBookingListParams) {
  const { courtId } = useCourtDetail();
  return useAdminBookingDirectory({ ...params, court_id: courtId });
}

export function CourtBookingsView() {
  const { courtId } = useCourtDetail();
  return (
    <AdminBookingListScreen
      pathname={courtDetailHref(courtId, "bookings")}
      layout="panel"
      useList={useCourtBookingList}
    />
  );
}

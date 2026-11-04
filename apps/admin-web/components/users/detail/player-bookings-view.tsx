"use client";

import { AdminBookingListScreen } from "@/components/bookings/admin-booking-list-screen";
import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { usePlayerBookings } from "@/hooks/use-admin-bookings";
import type { AdminBookingListParams } from "@/lib/api/admin-bookings";

function usePlayerBookingList(params: AdminBookingListParams) {
  const { userId } = useUserDetail();
  return usePlayerBookings(userId, params);
}

export function PlayerBookingsView() {
  const { userId } = useUserDetail();
  return (
    <AdminBookingListScreen
      pathname={`/users/players/${userId}/bookings`}
      showOrganization
      useList={usePlayerBookingList}
    />
  );
}

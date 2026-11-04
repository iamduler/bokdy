"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getOrganizationBooking,
  listOrganizationBookings,
  listPlayerBookings,
  type AdminBookingListParams,
} from "@/lib/api/admin-bookings";

export const adminBookingKeys = {
  all: ["admin", "bookings"] as const,
  org: (orgId: string, params: AdminBookingListParams) =>
    [...adminBookingKeys.all, "org", orgId, params] as const,
  detail: (orgId: string, bookingId: string) =>
    [...adminBookingKeys.all, "detail", orgId, bookingId] as const,
  player: (userId: string, params: AdminBookingListParams) =>
    [...adminBookingKeys.all, "player", userId, params] as const,
};

export function useOrganizationBookings(orgId: string, params: AdminBookingListParams) {
  return useQuery({
    queryKey: adminBookingKeys.org(orgId, params),
    queryFn: () => listOrganizationBookings(orgId, params),
    enabled: Boolean(orgId),
  });
}

export function useOrganizationBooking(orgId: string, bookingId: string) {
  return useQuery({
    queryKey: adminBookingKeys.detail(orgId, bookingId),
    queryFn: () => getOrganizationBooking(orgId, bookingId),
    enabled: Boolean(orgId && bookingId),
  });
}

export function usePlayerBookings(userId: string, params: AdminBookingListParams) {
  return useQuery({
    queryKey: adminBookingKeys.player(userId, params),
    queryFn: () => listPlayerBookings(userId, params),
    enabled: Boolean(userId),
  });
}

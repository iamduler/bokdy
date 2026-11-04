import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";
import { appendListPageQuery, type ListPageParams } from "@/lib/api/list-page";

export type AdminBooking = components["schemas"]["AdminBooking"];
export type AdminBookingPage = components["schemas"]["AdminBookingPage"];
export type AdminBookingDetail = components["schemas"]["AdminBookingDetail"];
export type AdminBookingStatus = AdminBooking["status"];

export type AdminBookingListParams = ListPageParams & {
  q?: string;
  status?: AdminBookingStatus;
  from?: string;
  to?: string;
};

const BOOKING_ZONE = "+07:00";

export function bookingDateFrom(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return `${value}T00:00:00${BOOKING_ZONE}`;
}

/** Exclusive end: the calendar day after the selected date, start of day. */
export function bookingDateTo(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const iso = next.toISOString().slice(0, 10);
  return `${iso}T00:00:00${BOOKING_ZONE}`;
}

function buildQuery(params: AdminBookingListParams): string {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.status) qs.set("status", params.status);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  appendListPageQuery(qs, params);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function listOrganizationBookings(orgId: string, params: AdminBookingListParams = {}) {
  return apiGo<AdminBookingPage>(
    `admin/organizations/${encodeURIComponent(orgId)}/bookings${buildQuery(params)}`,
  );
}

export function getOrganizationBooking(orgId: string, bookingId: string) {
  return apiGo<AdminBookingDetail>(
    `admin/organizations/${encodeURIComponent(orgId)}/bookings/${encodeURIComponent(bookingId)}`,
  );
}

export function listPlayerBookings(userId: string, params: AdminBookingListParams = {}) {
  return apiGo<AdminBookingPage>(
    `admin/users/players/${encodeURIComponent(userId)}/bookings${buildQuery(params)}`,
  );
}

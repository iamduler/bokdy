import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type PriceVersion = components["schemas"]["PriceVersion"];
export type PriceVersionStatus = PriceVersion["status"];

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

export function listPriceVersions(organizationId: string) {
  return apiGo<PriceVersion[]>("price-versions", { headers: orgHeaders(organizationId) });
}

export function getPriceVersion(organizationId: string, id: string) {
  return apiGo<PriceVersion>(`price-versions/${encodeURIComponent(id)}`, {
    headers: orgHeaders(organizationId),
  });
}

export type BranchSportPricing = components["schemas"]["BranchSportPricing"];
export type BranchPricingProfile = components["schemas"]["BranchPricingProfile"];
export type SaveBranchPricingProfileRequest =
  components["schemas"]["SaveBranchPricingProfileRequest"];

export function listBranchPricingProfiles(organizationId: string, branchId: string) {
  return apiGo<BranchSportPricing[]>(
    `branches/${encodeURIComponent(branchId)}/pricing-profiles`,
    { headers: orgHeaders(organizationId) },
  );
}

export function createBranchPricingProfile(
  organizationId: string,
  branchId: string,
  input: SaveBranchPricingProfileRequest,
) {
  return apiGo<BranchPricingProfile>(
    `branches/${encodeURIComponent(branchId)}/pricing-profiles`,
    {
      method: "POST",
      headers: orgHeaders(organizationId),
      body: JSON.stringify(input),
    },
  );
}

export function saveBranchPricingProfile(
  organizationId: string,
  branchId: string,
  profileId: string,
  input: SaveBranchPricingProfileRequest,
) {
  return apiGo<BranchPricingProfile>(
    `branches/${encodeURIComponent(branchId)}/pricing-profiles/${encodeURIComponent(profileId)}`,
    {
      method: "PUT",
      headers: orgHeaders(organizationId),
      body: JSON.stringify(input),
    },
  );
}

export function activateBranchPricingProfile(
  organizationId: string,
  branchId: string,
  profileId: string,
  input: SaveBranchPricingProfileRequest,
) {
  return apiGo<BranchPricingProfile>(
    `branches/${encodeURIComponent(branchId)}/pricing-profiles/${encodeURIComponent(profileId)}/activate`,
    {
      method: "POST",
      headers: orgHeaders(organizationId),
      body: JSON.stringify(input),
    },
  );
}

export function duplicateBranchPricingProfile(organizationId: string, branchId: string, profileId: string) {
  return apiGo<BranchPricingProfile>(
    `branches/${encodeURIComponent(branchId)}/pricing-profiles/${encodeURIComponent(profileId)}/duplicate`,
    { method: "POST", headers: orgHeaders(organizationId) },
  );
}

export type BranchHoliday = components["schemas"]["BranchHoliday"];
export type CalendarHoliday = components["schemas"]["CalendarHoliday"];
export type OrganizationHoliday = components["schemas"]["OrganizationHoliday"];
export type HolidayEffect = "include" | "exclude";
export type HolidayOverlayInput = { holiday_on: string; name: string; effect: HolidayEffect };

export function listBranchHolidays(organizationId: string, branchId: string) {
  return apiGo<{ holidays: BranchHoliday[] }>(`branches/${encodeURIComponent(branchId)}/holidays`, {
    headers: orgHeaders(organizationId),
  });
}

export function replaceBranchHolidays(
  organizationId: string,
  branchId: string,
  holidays: HolidayOverlayInput[],
) {
  return apiGo<{ holidays: BranchHoliday[] }>(`branches/${encodeURIComponent(branchId)}/holidays`, {
    method: "PUT",
    headers: orgHeaders(organizationId),
    body: JSON.stringify({ holidays }),
  });
}

export function listOrganizationHolidays(organizationId: string) {
  return apiGo<{ holidays: OrganizationHoliday[] }>(
    `organizations/${encodeURIComponent(organizationId)}/holidays`,
    { headers: orgHeaders(organizationId) },
  );
}

export function replaceOrganizationHolidays(organizationId: string, holidays: HolidayOverlayInput[]) {
  return apiGo<{ holidays: OrganizationHoliday[] }>(
    `organizations/${encodeURIComponent(organizationId)}/holidays`,
    {
      method: "PUT",
      headers: orgHeaders(organizationId),
      body: JSON.stringify({ holidays }),
    },
  );
}

export function listCalendarHolidays() {
  return apiGo<{ holidays: CalendarHoliday[] }>("admin/holidays");
}

export function replaceCalendarHolidays(holidays: { holiday_on: string; name: string }[]) {
  return apiGo<{ holidays: CalendarHoliday[] }>("admin/holidays", {
    method: "PUT",
    body: JSON.stringify({ holidays }),
  });
}

export function getPricingProfile(id: string, organizationId?: string) {
  return apiGo<BranchPricingProfile>(`pricing-profiles/${encodeURIComponent(id)}`, {
    headers: organizationId ? orgHeaders(organizationId) : undefined,
  });
}

export type PriceQuote = components["schemas"]["PriceQuote"];

export function calculatePrice(input: {
  court_id: string;
  starts_at: string;
  ends_at: string;
  customer_type?: "walk_in" | "member" | "vip";
}) {
  return apiGo<PriceQuote>("pricing/calculate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

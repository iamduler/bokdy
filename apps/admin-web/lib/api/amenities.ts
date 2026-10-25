import { apiGo } from "@/lib/api/client";

/**
 * Local types until `/reference/amenities` and `/branches/{id}/amenities`
 * land in OpenAPI + SDK. Mirrors reference.amenities.
 */
export type Amenity = {
  id: string;
  code: string;
  /** Resolved from Accept-Language when present. */
  name?: string;
  name_en: string;
  name_vi: string;
  icon?: string;
  is_active?: boolean;
};

export type PutBranchAmenitiesRequest = {
  amenity_ids: string[];
};

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

export function amenityLabel(amenity: Amenity, locale: string): string {
  if (locale.startsWith("vi")) {
    return amenity.name_vi || amenity.name || amenity.name_en;
  }
  return amenity.name_en || amenity.name || amenity.name_vi;
}

export function listAmenities() {
  return apiGo<Amenity[]>("reference/amenities");
}

/** Replace-all set; the API may return full amenities or bare ids. */
export function amenityIdsOf(rows: Array<Amenity | string> | undefined): string[] {
  return (rows ?? []).map((row) => (typeof row === "string" ? row : row.id));
}

export function getBranchAmenities(organizationId: string, branchId: string) {
  return apiGo<Array<Amenity | string>>(
    `branches/${encodeURIComponent(branchId)}/amenities`,
    { headers: orgHeaders(organizationId) },
  );
}

export function putBranchAmenities(
  organizationId: string,
  branchId: string,
  input: PutBranchAmenitiesRequest,
) {
  return apiGo<Array<Amenity | string>>(
    `branches/${encodeURIComponent(branchId)}/amenities`,
    {
      method: "PUT",
      headers: orgHeaders(organizationId),
      body: JSON.stringify(input),
    },
  );
}

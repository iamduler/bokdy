/**
 * Business code prefixes — mirror of backend/internal/platform/entitycode.
 * Format: {PREFIX}{5-digit} e.g. BRN00001. Server generates codes.
 */
export const ENTITY_CODE_SEQ_WIDTH = 5;

export const ENTITY_CODE_PREFIX = {
  /** organization.organizations / tenants */
  organization: "ORG",
  /** organization.business_units */
  businessUnit: "BU",
  /** organization.locations (Branch) */
  branch: "BRN",
  /** organization.teams */
  team: "TEM",
  /** crm.customers */
  customer: "CUS",
  /** catalog.sports */
  sport: "SPT",
  /** catalog.service_categories */
  serviceCategory: "SVC",
  /** catalog.services */
  service: "SRV",
  /** catalog.resource_categories */
  resourceCategory: "RCC",
  /** catalog.resources (court) */
  court: "CRT",
  /** catalog.resource_capabilities */
  resourceCapability: "CAP",
  /** infrastructure job definitions */
  jobDefinition: "JOB",
} as const;

export type EntityCodePrefixKey = keyof typeof ENTITY_CODE_PREFIX;

/** Default venue business timezone (UTC+7). Not editable on entity forms. */
export const DEFAULT_BRANCH_TIMEZONE = "Asia/Ho_Chi_Minh";

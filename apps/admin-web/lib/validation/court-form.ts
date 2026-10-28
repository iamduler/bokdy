import { z } from "zod";

export const COURT_ENVIRONMENTS = ["indoor", "outdoor", "unspecified"] as const;
export type CourtEnvironmentValue = (typeof COURT_ENVIRONMENTS)[number];

/** Mirrors OpenAPI `CourtSurface`. */
export const COURT_SURFACES = [
  "unspecified",
  "pvc",
  "wood",
  "hard_court",
  "grass",
  "artificial_turf",
  "clay",
  "rubber",
  "other",
] as const;
export type CourtSurfaceValue = (typeof COURT_SURFACES)[number];

export const COURT_FORM_STATUSES = [
  "inactive",
  "active",
  "maintenance",
  "archived",
] as const;
export type CourtFormStatus = (typeof COURT_FORM_STATUSES)[number];

export const COURT_EDITABLE_STATUSES = [
  "inactive",
  "active",
  "maintenance",
] as const;

const formFields = z.object({
  branch_id: z.string().trim(),
  sport_id: z.string().trim(),
  name_vi: z.string().trim(),
  /** Derived from name_vi — not edited on UI. */
  name_en: z.string().trim(),
  environment: z.enum(COURT_ENVIRONMENTS),
  surface: z.enum(COURT_SURFACES),
  dimensions: z.string().trim(),
  /** HTML from RichTextEditor; sanitized again on the server. */
  description_vi: z.string(),
  description_en: z.string(),
  amenity_ids: z.array(z.string()),
  /** Edit-only; create/duplicate ignore and leave server default. */
  status: z.enum(COURT_FORM_STATUSES),
});

export type CourtFormValues = z.infer<typeof formFields>;

export function courtFormSchema(messages: {
  nameRequired: string;
  branchRequired: string;
  sportRequired: string;
}) {
  return formFields.superRefine((value, ctx) => {
    if (!value.name_vi.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["name_vi"],
        message: messages.nameRequired,
      });
    }
    if (!value.branch_id) {
      ctx.addIssue({
        code: "custom",
        path: ["branch_id"],
        message: messages.branchRequired,
      });
    }
    if (!value.sport_id) {
      ctx.addIssue({
        code: "custom",
        path: ["sport_id"],
        message: messages.sportRequired,
      });
    }
  });
}

export function emptyCourtFormValues(
  defaults?: Partial<CourtFormValues>,
): CourtFormValues {
  return {
    branch_id: "",
    sport_id: "",
    name_vi: "",
    name_en: "",
    environment: "unspecified",
    surface: "unspecified",
    dimensions: "",
    description_vi: "",
    description_en: "",
    amenity_ids: [],
    status: "inactive",
    ...defaults,
  };
}

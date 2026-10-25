import { z } from "zod";

const formFields = z.object({
  name_vi: z.string().trim(),
  name_en: z.string().trim(),
  slug: z.string().trim(),
  sport_ids: z.array(z.string()),
  phone: z.string().trim(),
  email: z.string().trim(),
  website: z.string().trim(),
  facebook_url: z.string().trim(),
  google_maps_url: z.string().trim(),
  founded_year: z.string().trim(),
  /** Hidden; create defaults to today, edit uses branch.created_at. Not submitted. */
  joined_at: z.string().trim(),
  province_id: z.string().trim(),
  ward_id: z.string().trim(),
  address_line_1: z.string().trim(),
  latitude: z.string().trim(),
  longitude: z.string().trim(),
  status: z.string(),
});

export type BranchFormValues = z.infer<typeof formFields>;

function optionalUrlIssue(
  value: string,
  path: keyof BranchFormValues,
  message: string,
  ctx: z.RefinementCtx,
) {
  if (value && !z.url().safeParse(value).success) {
    ctx.addIssue({ code: "custom", path: [path], message });
  }
}

export function branchFormSchema(messages: {
  nameRequired: string;
  emailInvalid: string;
  websiteInvalid: string;
  addressRequired: string;
  coordsInvalid: string;
  foundedYearInvalid: string;
}) {
  return formFields.superRefine((value, ctx) => {
    if (!value.name_vi.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["name_vi"],
        message: messages.nameRequired,
      });
    }
    if (value.email && !z.email().safeParse(value.email).success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: messages.emailInvalid,
      });
    }
    optionalUrlIssue(value.website, "website", messages.websiteInvalid, ctx);
    optionalUrlIssue(value.facebook_url, "facebook_url", messages.websiteInvalid, ctx);
    optionalUrlIssue(value.google_maps_url, "google_maps_url", messages.websiteInvalid, ctx);
    if (value.founded_year) {
      const year = Number(value.founded_year);
      if (!Number.isInteger(year) || year < 1800 || year > 2100) {
        ctx.addIssue({
          code: "custom",
          path: ["founded_year"],
          message: messages.foundedYearInvalid,
        });
      }
    }
    if (!value.province_id) {
      ctx.addIssue({
        code: "custom",
        path: ["province_id"],
        message: messages.addressRequired,
      });
    }
    if (!value.ward_id) {
      ctx.addIssue({
        code: "custom",
        path: ["ward_id"],
        message: messages.addressRequired,
      });
    }
    if (!value.address_line_1) {
      ctx.addIssue({
        code: "custom",
        path: ["address_line_1"],
        message: messages.addressRequired,
      });
    }
    const lat = Number(value.latitude);
    const lng = Number(value.longitude);
    if (!value.latitude || Number.isNaN(lat) || lat < -90 || lat > 90) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: messages.coordsInvalid,
      });
    }
    if (!value.longitude || Number.isNaN(lng) || lng < -180 || lng > 180) {
      ctx.addIssue({
        code: "custom",
        path: ["longitude"],
        message: messages.coordsInvalid,
      });
    }
  });
}

/** Local calendar date YYYY-MM-DD for hidden joined_at. */
export function todayDateInput(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateInputFromIso(iso: string | undefined): string {
  if (!iso) return todayDateInput();
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : todayDateInput();
}

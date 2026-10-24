import { z } from "zod";

const organizationTypes = ["company", "club", "school", "government", "individual", "other"] as const;

const formFields = z.object({
  name_vi: z.string().trim(),
  name_en: z.string().trim(),
  legal_name: z.string().trim(),
  organization_type: z.enum(organizationTypes),
  slug: z.string().trim(),
  tax_code: z.string().trim(),
  email: z.string().trim(),
  phone: z.string().trim(),
  website: z.string().trim(),
  province_id: z.string().trim(),
  ward_id: z.string().trim(),
  address_line_1: z.string().trim(),
  status: z.string(),
  suspend_reason: z.string(),
});

export type OrganizationFormValues = z.infer<typeof formFields>;
export type OrganizationType = (typeof organizationTypes)[number];
export const ORGANIZATION_TYPES = organizationTypes;

export function organizationFormSchema(messages: {
  nameRequired: string;
  emailInvalid: string;
  websiteInvalid: string;
  addressIncomplete: string;
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
    if (value.website && !z.url().safeParse(value.website).success) {
      ctx.addIssue({
        code: "custom",
        path: ["website"],
        message: messages.websiteInvalid,
      });
    }
    if (!value.province_id) {
      ctx.addIssue({
        code: "custom",
        path: ["province_id"],
        message: messages.addressIncomplete,
      });
    }
    if (!value.ward_id) {
      ctx.addIssue({
        code: "custom",
        path: ["ward_id"],
        message: messages.addressIncomplete,
      });
    }
  });
}

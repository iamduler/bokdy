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
  address_line_2: z.string().trim(),
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
    if (!value.name_vi && !value.name_en) {
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
    const hasAddress = Boolean(value.province_id || value.ward_id || value.address_line_1 || value.address_line_2);
    if (hasAddress && (!value.province_id || !value.ward_id)) {
      ctx.addIssue({
        code: "custom",
        path: [value.province_id ? "ward_id" : "province_id"],
        message: messages.addressIncomplete,
      });
    }
  });
}

import { z } from "zod";

const formFields = z.object({
  name_vi: z.string().trim(),
  name_en: z.string().trim(),
  code: z.string().trim(),
  phone: z.string().trim(),
  email: z.string().trim(),
  timezone: z.string().trim(),
  province_id: z.string().trim(),
  ward_id: z.string().trim(),
  address_line_1: z.string().trim(),
  address_line_2: z.string().trim(),
  status: z.string(),
});

export type BranchFormValues = z.infer<typeof formFields>;

export function branchFormSchema(messages: {
  nameRequired: string;
  emailInvalid: string;
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
    const hasAddress = Boolean(
      value.province_id || value.ward_id || value.address_line_1 || value.address_line_2,
    );
    if (hasAddress && !value.province_id) {
      ctx.addIssue({
        code: "custom",
        path: ["province_id"],
        message: messages.addressIncomplete,
      });
    }
    if (hasAddress && !value.ward_id) {
      ctx.addIssue({
        code: "custom",
        path: ["ward_id"],
        message: messages.addressIncomplete,
      });
    }
  });
}

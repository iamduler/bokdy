import { z } from "zod";

export function createOrganizationSchema(messages: { nameRequired: string }) {
  return z
    .object({
      name: z.string().trim().optional(),
      name_vi: z.string().trim().optional(),
      name_en: z.string().trim().optional(),
      code: z.string().trim().optional(),
      email: z.string().trim().optional(),
      phone: z.string().trim().optional(),
    })
    .superRefine((value, ctx) => {
      const hasName = Boolean(value.name || value.name_vi || value.name_en);
      if (!hasName) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: messages.nameRequired,
        });
      }
    });
}

export type CreateOrganizationFormValues = z.infer<ReturnType<typeof createOrganizationSchema>>;

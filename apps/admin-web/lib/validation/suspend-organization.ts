import { z } from "zod";

export function suspendOrganizationSchema(messages: { required: string }) {
  return z.object({
    reason: z.string().trim().min(1, messages.required),
  });
}

export type SuspendOrganizationFormValues = z.infer<ReturnType<typeof suspendOrganizationSchema>>;

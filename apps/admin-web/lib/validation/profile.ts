import { z } from "zod";

export function profileSchema(messages: { currencyInvalid: string }) {
  return z.object({
    theme: z.enum(["light", "dark", "system"]),
    date_format: z.enum(["dmy", "mdy", "ymd"]),
    timezone: z.string(),
    preferred_currency_code: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => value === "" || value.length === 3, messages.currencyInvalid),
  });
}

export type ProfileFormValues = z.infer<ReturnType<typeof profileSchema>>;

import { z } from "zod";

export function profileSchema(messages: { currencyInvalid: string; required: string }) {
  return z.object({
    first_name: z.string().trim().min(1, messages.required),
    last_name: z.string(),
    display_name: z.string(),
    gender: z.enum(["", "male", "female", "other", "undisclosed"]),
    date_of_birth: z.string(),
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

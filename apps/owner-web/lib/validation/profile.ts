import { z } from "zod";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function personalSchema(messages: { required: string }) {
  return z.object({
    first_name: z.string().trim().min(1, messages.required),
    last_name: z.string(),
  });
}

export function passwordSchema(messages: { required: string }) {
  return z.object({
    current_password: z.string().min(1, messages.required),
    password: z.string().regex(passwordPattern, messages.required),
  });
}

export function transferSchema(messages: { required: string }) {
  return z.object({
    organization_id: z.string().uuid(messages.required),
    successor_user_id: z.string().uuid(messages.required),
  });
}

export type PersonalValues = z.infer<ReturnType<typeof personalSchema>>;
export type PasswordValues = z.infer<ReturnType<typeof passwordSchema>>;
export type TransferValues = z.infer<ReturnType<typeof transferSchema>>;

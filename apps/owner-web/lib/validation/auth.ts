import { z } from "zod";

export function loginSchema(messages: { required: string; emailInvalid: string }) {
  return z.object({
    email: z.string().trim().min(1, messages.required).email(messages.emailInvalid),
    password: z.string().min(1, messages.required),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof loginSchema>>;

const passwordPolicy =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function registerSchema(messages: {
  required: string;
  emailInvalid: string;
  passwordPolicy: string;
}) {
  return z.object({
    full_name: z.string().trim().min(1, messages.required),
    email: z.string().trim().min(1, messages.required).email(messages.emailInvalid),
    password: z
      .string()
      .min(1, messages.required)
      .regex(passwordPolicy, messages.passwordPolicy),
  });
}

export type RegisterFormValues = z.infer<ReturnType<typeof registerSchema>>;

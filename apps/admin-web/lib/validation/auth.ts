import { z } from "zod";

export function loginSchema(messages: { required: string; emailInvalid: string }) {
  return z.object({
    email: z.string().trim().min(1, messages.required).email(messages.emailInvalid),
    password: z.string().min(1, messages.required),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof loginSchema>>;

export function forgotPasswordSchema(messages: { required: string; emailInvalid: string }) {
  return z.object({
    email: z.string().trim().min(1, messages.required).email(messages.emailInvalid),
  });
}

export type ForgotPasswordFormValues = z.infer<ReturnType<typeof forgotPasswordSchema>>;

const passwordPolicy =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function resetPasswordSchema(messages: {
  required: string;
  passwordPolicy: string;
  passwordMismatch: string;
}) {
  return z
    .object({
      newPassword: z
        .string()
        .min(1, messages.required)
        .regex(passwordPolicy, messages.passwordPolicy),
      confirmPassword: z.string().min(1, messages.required),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: messages.passwordMismatch,
      path: ["confirmPassword"],
    });
}

export type ResetPasswordFormValues = z.infer<ReturnType<typeof resetPasswordSchema>>;

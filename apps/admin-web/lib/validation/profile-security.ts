import { z } from "zod";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function passwordSchema(messages: { required: string }) {
  return z.object({
    current_password: z.string().min(1, messages.required),
    password: z.string().regex(passwordPattern, messages.required),
  });
}

/** Signed-in profile change: new password + confirm (no current password). */
export function changePasswordSchema(messages: { required: string; mismatch: string }) {
  return z
    .object({
      password: z.string().regex(passwordPattern, messages.required),
      password_confirm: z.string().min(1, messages.required),
    })
    .refine((values) => values.password === values.password_confirm, {
      message: messages.mismatch,
      path: ["password_confirm"],
    });
}

export function changeEmailSchema(messages: { required: string; invalid: string }) {
  return z.object({
    current_password: z.string().min(1, messages.required),
    email: z.string().trim().email(messages.invalid).min(1, messages.required),
  });
}

export function changePhoneSchema(messages: { required: string }) {
  return z.object({
    current_password: z.string().min(1, messages.required),
    phone: z.string().trim().min(1, messages.required),
  });
}

export function mfaConfirmSchema(messages: { required: string }) {
  return z.object({
    code: z.string().trim().min(1, messages.required),
  });
}

export function employeeSchema() {
  return z.object({
    employee_code: z.string(),
    department: z.string(),
    job_title: z.string(),
    work_email: z.string(),
    work_phone: z.string(),
    employment_status: z.enum(["active", "leave", "deactivated"]),
  });
}

export type PasswordValues = z.infer<ReturnType<typeof passwordSchema>>;
export type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>;
export type ChangeEmailValues = z.infer<ReturnType<typeof changeEmailSchema>>;
export type ChangePhoneValues = z.infer<ReturnType<typeof changePhoneSchema>>;
export type MfaConfirmValues = z.infer<ReturnType<typeof mfaConfirmSchema>>;
export type EmployeeValues = z.infer<ReturnType<typeof employeeSchema>>;
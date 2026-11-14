import { z } from "zod";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function passwordSchema(messages: { required: string }) {
  return z.object({
    current_password: z.string().min(1, messages.required),
    password: z.string().regex(passwordPattern, messages.required),
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
export type EmployeeValues = z.infer<ReturnType<typeof employeeSchema>>;

import { z } from "zod";

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const staffRoles = ["org_owner", "org_staff"] as const;

const membership = z.object({
  staff_id: z.string(),
  organization_id: z.string(),
  organization_name: z.string(),
  staff_role: z.string(),
  title: z.string(),
});

const formFields = z.object({
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string(),
  password: z.string(),
  confirm_password: z.string(),
  organization_id: z.string(),
  staff_role: z.string(),
  title: z.string(),
  memberships: z.array(membership),
});

export type UserAccountFormValues = z.infer<typeof formFields>;
export type UserAccountAudience = "players" | "owners" | "admins";
export type UserAccountMode = "create" | "edit";

export function emptyUserAccount(): UserAccountFormValues {
  return {
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    confirm_password: "",
    organization_id: "",
    staff_role: "",
    title: "",
    memberships: [],
  };
}

function isStaffRole(value: string): boolean {
  return (staffRoles as readonly string[]).includes(value);
}

export function userAccountSchema(
  messages: {
    required: string;
    emailInvalid: string;
    passwordPolicy: string;
    passwordMismatch: string;
  },
  options: { mode: UserAccountMode; audience: UserAccountAudience },
) {
  return formFields.superRefine((value, ctx) => {
    const email = value.email.trim();
    if (!email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: messages.required });
    } else if (!z.email().safeParse(email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: messages.emailInvalid });
    }
    if (!value.first_name.trim()) {
      ctx.addIssue({ code: "custom", path: ["first_name"], message: messages.required });
    }
    if (options.mode === "create") {
      if (!value.password) {
        ctx.addIssue({ code: "custom", path: ["password"], message: messages.required });
      } else if (!passwordPolicy.test(value.password)) {
        ctx.addIssue({ code: "custom", path: ["password"], message: messages.passwordPolicy });
      }
      if (!value.confirm_password) {
        ctx.addIssue({ code: "custom", path: ["confirm_password"], message: messages.required });
      } else if (value.password !== value.confirm_password) {
        ctx.addIssue({
          code: "custom",
          path: ["confirm_password"],
          message: messages.passwordMismatch,
        });
      }
    }
    if (options.mode === "create" && options.audience === "owners") {
      if (!value.organization_id.trim()) {
        ctx.addIssue({ code: "custom", path: ["organization_id"], message: messages.required });
      }
      if (!isStaffRole(value.staff_role)) {
        ctx.addIssue({ code: "custom", path: ["staff_role"], message: messages.required });
      }
    }
    if (options.mode === "edit" && options.audience === "owners") {
      value.memberships.forEach((membership, index) => {
        if (!isStaffRole(membership.staff_role)) {
          ctx.addIssue({
            code: "custom",
            path: ["memberships", index, "staff_role"],
            message: messages.required,
          });
        }
      });
    }
  });
}

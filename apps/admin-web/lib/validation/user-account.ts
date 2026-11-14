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

const genders = ["", "male", "female", "other", "undisclosed"] as const;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const currencyPattern = /^[A-Za-z]{3}$/;

const formFields = z.object({
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string(),
  phone: z.string(),
  gender: z.string(),
  date_of_birth: z.string(),
  locale_id: z.string(),
  timezone: z.string(),
  country_id: z.string(),
  preferred_currency_code: z.string(),
  theme: z.string(),
  date_format: z.string(),
  province_id: z.string(),
  ward_id: z.string(),
  address_line: z.string(),
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
    full_name: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    locale_id: "",
    timezone: "Asia/Ho_Chi_Minh",
    country_id: "",
    preferred_currency_code: "VND",
    theme: "system",
    date_format: "dmy",
    province_id: "",
    ward_id: "",
    address_line: "",
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

function todayISODate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function userAccountSchema(
  messages: {
    required: string;
    emailInvalid: string;
    passwordPolicy: string;
    passwordMismatch: string;
    dateInvalid: string;
    dateFuture: string;
    genderInvalid: string;
    currencyInvalid: string;
    wardRequiresProvince: string;
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
    const dob = value.date_of_birth.trim();
    if (dob && !datePattern.test(dob)) {
      ctx.addIssue({ code: "custom", path: ["date_of_birth"], message: messages.dateInvalid });
    } else if (dob && dob > todayISODate()) {
      ctx.addIssue({ code: "custom", path: ["date_of_birth"], message: messages.dateFuture });
    }
    if (!(genders as readonly string[]).includes(value.gender)) {
      ctx.addIssue({ code: "custom", path: ["gender"], message: messages.genderInvalid });
    }
    const currency = value.preferred_currency_code.trim();
    if (currency && !currencyPattern.test(currency)) {
      ctx.addIssue({
        code: "custom",
        path: ["preferred_currency_code"],
        message: messages.currencyInvalid,
      });
    }
    if (value.ward_id.trim() && !value.province_id.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["ward_id"],
        message: messages.wardRequiresProvince,
      });
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

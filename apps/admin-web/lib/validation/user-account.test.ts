import { describe, expect, it } from "vitest";

import { userAccountSchema } from "./user-account";

const messages = {
  required: "required",
  emailInvalid: "email",
  passwordPolicy: "policy",
  passwordMismatch: "mismatch",
  dateInvalid: "date",
  genderInvalid: "gender",
  currencyInvalid: "currency",
  wardRequiresProvince: "ward",
};

const password = "Abcdef1!";

function base() {
  return {
    email: "a@b.co",
    first_name: "An",
    last_name: "Le",
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
    password,
    confirm_password: password,
    organization_id: "",
    staff_role: "",
    title: "",
    memberships: [],
  };
}

describe("userAccountSchema", () => {
  it("requires email, given name, and a matching password when creating a player", () => {
    const schema = userAccountSchema(messages, { mode: "create", audience: "players" });
    expect(schema.safeParse({ ...base(), email: "" }).success).toBe(false);
    expect(schema.safeParse({ ...base(), first_name: "" }).success).toBe(false);
    expect(schema.safeParse({ ...base(), last_name: "" }).success).toBe(true);
    expect(schema.safeParse({ ...base(), password: "" }).success).toBe(false);
    expect(schema.safeParse({ ...base(), password: "weak" }).success).toBe(false);
    expect(schema.safeParse({ ...base(), confirm_password: "Abcdef1?" }).success).toBe(false);
    expect(schema.safeParse(base()).success).toBe(true);
  });

  it("does not require a password when editing", () => {
    const schema = userAccountSchema(messages, { mode: "edit", audience: "players" });
    expect(
      schema.safeParse({ ...base(), password: "", confirm_password: "" }).success,
    ).toBe(true);
  });

  it("requires an organization and a seeded role when creating an owner", () => {
    const schema = userAccountSchema(messages, { mode: "create", audience: "owners" });
    expect(schema.safeParse(base()).success).toBe(false);
    expect(
      schema.safeParse({ ...base(), organization_id: "org-1", staff_role: "org_staff" }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ ...base(), organization_id: "org-1", staff_role: "custom" }).success,
    ).toBe(false);
  });

  it("does not require an organization when creating an admin", () => {
    const schema = userAccountSchema(messages, { mode: "create", audience: "admins" });
    expect(schema.safeParse(base()).success).toBe(true);
  });

  it("accepts an empty profile and rejects a bad date, gender, or currency", () => {
    const schema = userAccountSchema(messages, { mode: "edit", audience: "players" });
    expect(schema.safeParse({ ...base(), password: "", confirm_password: "", gender: "female", date_of_birth: "1990-01-02" }).success).toBe(true);
    expect(schema.safeParse({ ...base(), password: "", confirm_password: "", date_of_birth: "02-01-1990" }).success).toBe(false);
    expect(schema.safeParse({ ...base(), password: "", confirm_password: "", gender: "nope" }).success).toBe(false);
    expect(schema.safeParse({ ...base(), password: "", confirm_password: "", preferred_currency_code: "dong" }).success).toBe(false);
    expect(schema.safeParse({ ...base(), password: "", confirm_password: "", preferred_currency_code: "" }).success).toBe(true);
    expect(schema.safeParse({ ...base(), password: "", confirm_password: "", ward_id: "ward-1" }).success).toBe(false);
    expect(
      schema.safeParse({ ...base(), password: "", confirm_password: "", province_id: "province-1", ward_id: "ward-1" }).success,
    ).toBe(true);
  });
});

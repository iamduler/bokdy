import { describe, expect, it } from "vitest";

import { passwordSchema as playerPassword, personalSchema as playerPersonal, privacySchema } from "../../../player-web/lib/validation/profile";
import { personalSchema as ownerPersonal, transferSchema } from "../../../owner-web/lib/validation/profile";
import {
  changeEmailSchema,
  changePasswordSchema,
  changePhoneSchema,
  employeeSchema,
  mfaConfirmSchema,
  passwordSchema,
} from "./profile-security";
import { profileSchema } from "./profile";

describe("profile schemas", () => {
  it("requires a given name on the admin profile", () => {
    const parsed = profileSchema({ currencyInvalid: "bad", required: "required" }).safeParse({
      first_name: "",
      last_name: "",
      full_name: "",
      gender: "",
      date_of_birth: "",
      theme: "system",
      date_format: "dmy",
      timezone: "",
      preferred_currency_code: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("keeps employee status and password policy", () => {
    expect(employeeSchema().safeParse({
      employee_code: "E1",
      department: "Ops",
      job_title: "Admin",
      work_email: "",
      work_phone: "",
      employment_status: "active",
    }).success).toBe(true);
    expect(passwordSchema({ required: "required" }).safeParse({ current_password: "", password: "Abcdef1!" }).success).toBe(false);
    expect(
      changePasswordSchema({ required: "required", mismatch: "mismatch" }).safeParse({
        password: "Abcdef1!",
        password_confirm: "Abcdef2!",
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema({ required: "required", mismatch: "mismatch" }).safeParse({
        password: "Abcdef1!",
        password_confirm: "Abcdef1!",
      }).success,
    ).toBe(true);
    expect(mfaConfirmSchema({ required: "required" }).safeParse({ code: "" }).success).toBe(false);
    expect(mfaConfirmSchema({ required: "required" }).safeParse({ code: "123456" }).success).toBe(true);
    expect(
      changeEmailSchema({ required: "required", invalid: "bad" }).safeParse({
        current_password: "x",
        email: "not-an-email",
      }).success,
    ).toBe(false);
    expect(
      changePhoneSchema({ required: "required" }).safeParse({
        current_password: "x",
        phone: "0901234567",
      }).success,
    ).toBe(true);
  });

  it("requires a player given name and accepts private visibility", () => {
    expect(playerPersonal({ required: "required" }).safeParse({
      first_name: " ",
      last_name: "Nguyen",
      gender: "",
      date_of_birth: "",
    }).success).toBe(false);
    expect(privacySchema().safeParse({
      bio: "",
      preferred_playing_times: "",
      preferred_locations: "",
      visibility: "private",
      is_open_to_invitations: false,
      is_discoverable: false,
      is_activity_visible: false,
    }).success).toBe(true);
    expect(playerPassword({ required: "required" }).safeParse({ current_password: "old", password: "short" }).success).toBe(false);
  });

  it("keeps owner personal data separate from an ownership transfer", () => {
    expect(ownerPersonal({ required: "required" }).safeParse({
      first_name: "An",
      last_name: "Nguyen",
    }).success).toBe(true);
    expect(transferSchema({ required: "required" }).safeParse({
      organization_id: "not-a-uuid",
      successor_user_id: "019fcd0a-17a9-7105-80ba-7fe9960cd9b0",
    }).success).toBe(false);
  });
});

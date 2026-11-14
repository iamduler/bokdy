import { describe, expect, it } from "vitest";

import { passwordSchema, personalSchema, privacySchema } from "./profile";

const messages = { required: "required" };

describe("player profile schema", () => {
  it("requires a given name", () => {
    const parsed = personalSchema(messages).safeParse({
      first_name: " ",
      last_name: "Nguyen",
      display_name: "Nick",
      gender: "",
      date_of_birth: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a private profile and a policy password", () => {
    expect(privacySchema().safeParse({
      bio: "",
      preferred_playing_times: "",
      preferred_locations: "",
      visibility: "private",
      is_open_to_invitations: false,
      is_discoverable: false,
      is_activity_visible: false,
    }).success).toBe(true);
    expect(passwordSchema(messages).safeParse({ current_password: "old", password: "short" }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { personalSchema, transferSchema } from "./profile";

describe("owner profile schema", () => {
  it("keeps personal names separate from an ownership transfer", () => {
    expect(personalSchema({ required: "required" }).safeParse({
      first_name: "An",
      last_name: "Nguyen",
      display_name: "An",
    }).success).toBe(true);
    expect(transferSchema({ required: "required" }).safeParse({
      organization_id: "not-a-uuid",
      successor_user_id: "019fcd0a-17a9-7105-80ba-7fe9960cd9b0",
    }).success).toBe(false);
  });
});

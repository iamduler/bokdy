import { z } from "zod";

const roleCodes = ["org_owner", "org_staff"] as const;

const formFields = z.object({
  email: z.string().trim(),
  role_code: z.enum(roleCodes),
});

export type TeamInviteFormValues = z.infer<typeof formFields>;
export const TEAM_ROLE_CODES = roleCodes;

export function emptyTeamInviteValues(): TeamInviteFormValues {
  return { email: "", role_code: "org_staff" };
}

export function teamInviteSchema(messages: {
  emailRequired: string;
  emailInvalid: string;
}) {
  return formFields.superRefine((value, ctx) => {
    if (!value.email.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: messages.emailRequired,
      });
      return;
    }
    if (!z.email().safeParse(value.email).success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: messages.emailInvalid,
      });
    }
  });
}

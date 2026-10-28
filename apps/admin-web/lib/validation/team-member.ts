import { z } from "zod";

const roleCodes = ["org_owner", "org_staff"] as const;

const formFields = z.object({
  title: z.string().trim(),
  branch_id: z.string().trim(),
  role_code: z.enum(roleCodes),
});

export type TeamMemberFormValues = z.infer<typeof formFields>;

export function teamMemberSchema() {
  return formFields;
}

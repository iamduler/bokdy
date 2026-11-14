import { z } from "zod";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function personalSchema(messages: { required: string }) {
  return z.object({
    first_name: z.string().trim().min(1, messages.required),
    last_name: z.string(),
    display_name: z.string(),
    gender: z.enum(["", "male", "female", "other", "undisclosed"]),
    date_of_birth: z.string(),
  });
}

export function privacySchema() {
  return z.object({
    bio: z.string(),
    preferred_playing_times: z.string(),
    preferred_locations: z.string(),
    visibility: z.enum(["public", "members", "private"]),
    is_open_to_invitations: z.boolean(),
    is_discoverable: z.boolean(),
    is_activity_visible: z.boolean(),
  });
}

export function passwordSchema(messages: { required: string }) {
  return z.object({
    current_password: z.string().min(1, messages.required),
    password: z.string().regex(passwordPattern, messages.required),
  });
}

export type PersonalValues = z.infer<ReturnType<typeof personalSchema>>;
export type PrivacyValues = z.infer<ReturnType<typeof privacySchema>>;
export type PasswordValues = z.infer<ReturnType<typeof passwordSchema>>;

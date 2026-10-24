import { z } from "zod";

const formFields = z.object({
  name_vi: z.string().trim(),
  name_en: z.string().trim(),
  slug: z.string().trim(),
  sport_ids: z.array(z.string()),
  phone: z.string().trim(),
  email: z.string().trim(),
  province_id: z.string().trim(),
  ward_id: z.string().trim(),
  address_line_1: z.string().trim(),
  latitude: z.string().trim(),
  longitude: z.string().trim(),
  status: z.string(),
});

export type BranchFormValues = z.infer<typeof formFields>;

export function branchFormSchema(messages: {
  nameRequired: string;
  emailInvalid: string;
  addressRequired: string;
  coordsInvalid: string;
}) {
  return formFields.superRefine((value, ctx) => {
    if (!value.name_vi.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["name_vi"],
        message: messages.nameRequired,
      });
    }
    if (value.email && !z.email().safeParse(value.email).success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: messages.emailInvalid,
      });
    }
    if (!value.province_id) {
      ctx.addIssue({
        code: "custom",
        path: ["province_id"],
        message: messages.addressRequired,
      });
    }
    if (!value.ward_id) {
      ctx.addIssue({
        code: "custom",
        path: ["ward_id"],
        message: messages.addressRequired,
      });
    }
    if (!value.address_line_1) {
      ctx.addIssue({
        code: "custom",
        path: ["address_line_1"],
        message: messages.addressRequired,
      });
    }
    const lat = Number(value.latitude);
    const lng = Number(value.longitude);
    if (!value.latitude || Number.isNaN(lat) || lat < -90 || lat > 90) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: messages.coordsInvalid,
      });
    }
    if (!value.longitude || Number.isNaN(lng) || lng < -180 || lng > 180) {
      ctx.addIssue({
        code: "custom",
        path: ["longitude"],
        message: messages.coordsInvalid,
      });
    }
  });
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

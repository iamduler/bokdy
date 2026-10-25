import { z } from "zod";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const dayFields = z.object({
  weekday: z.number().int().min(0).max(6),
  is_closed: z.boolean(),
  opens_at: z.string().trim(),
  closes_at: z.string().trim(),
});

const formFields = z.object({
  days: z.array(dayFields).length(7),
});

export type BranchScheduleFormValues = z.infer<typeof formFields>;

export function branchScheduleSchema(messages: {
  timeRequired: string;
  rangeInvalid: string;
}) {
  return formFields.superRefine((value, ctx) => {
    value.days.forEach((day, index) => {
      if (day.is_closed) return;
      const opensOk = TIME_RE.test(day.opens_at);
      const closesOk = TIME_RE.test(day.closes_at);
      if (!opensOk) {
        ctx.addIssue({
          code: "custom",
          path: ["days", index, "opens_at"],
          message: messages.timeRequired,
        });
      }
      if (!closesOk) {
        ctx.addIssue({
          code: "custom",
          path: ["days", index, "closes_at"],
          message: messages.timeRequired,
        });
      }
      if (opensOk && closesOk && day.opens_at >= day.closes_at) {
        ctx.addIssue({
          code: "custom",
          path: ["days", index, "closes_at"],
          message: messages.rangeInvalid,
        });
      }
    });
  });
}

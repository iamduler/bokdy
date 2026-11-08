import { z } from "zod";

import { conflictPairs } from "./schedule-issues";

export const SLOT_UNITS = [15, 30, 45, 60, 90, 120] as const;
export const CUSTOMER_TYPES = ["walk_in", "member", "vip"] as const;

const CLOCK_RE = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function clockMinutes(value: string) {
  if (!CLOCK_RE.test(value)) return null;
  const [hour, minute] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function money(message: string) {
  return z.number({ error: message }).min(0, message);
}

function canConflict(window: {
  weekdays: number[];
  starts_at: string;
  ends_at: string;
  amount: number;
}) {
  const start = clockMinutes(window.starts_at);
  const end = clockMinutes(window.ends_at);
  return (
    window.weekdays.length > 0 &&
    start != null &&
    end != null &&
    end > start &&
    Number.isFinite(window.amount)
  );
}

export function branchPricingSchema(messages: {
  name: string;
  slot: string;
  durations: string;
  amount: string;
  window: string;
  clock: string;
  order: string;
  conflict: string;
  sport: string;
  group: string;
}) {
  const clock = z.string().regex(CLOCK_RE, messages.clock);
  const namedWindow = z
    .object({
      name: z.string().trim().max(80, messages.group),
      starts_at: clock,
      ends_at: clock,
      amount: money(messages.amount),
    })
    .superRefine((window, ctx) => {
      const start = clockMinutes(window.starts_at);
      const end = clockMinutes(window.ends_at);
      if (start == null || end == null || end > start) return;
      ctx.addIssue({ code: "custom", path: ["ends_at"], message: messages.order });
    });
  return z
    .object({
      name: z.string().trim().min(1, messages.name).max(80, messages.name),
      sport_id: z.string().uuid(messages.sport),
      customer_type: z.enum(CUSTOMER_TYPES),
      slot_unit_minutes: z
        .number()
        .refine((value) => value >= 15 && value <= 180 && value % 15 === 0, messages.slot),
      unlimited_duration: z.boolean(),
      durations: z.array(z.number().int().positive()),
      base_amount: money(messages.amount),
      day_groups: z.array(
        z.object({
          name: z.string().trim().max(80, messages.group),
          weekdays: z.array(z.number().int().min(0).max(6)).min(1, messages.window),
          windows: z.array(namedWindow),
        }),
      ),
      holiday_windows: z.array(namedWindow),
    })
    .superRefine((value, ctx) => {
      if (!value.unlimited_duration && value.durations.length === 0) {
        ctx.addIssue({ code: "custom", path: ["durations"], message: messages.durations });
      }
      const flat = value.day_groups.flatMap((group, groupIndex) =>
        group.windows.map((window, windowIndex) => ({
          groupIndex,
          windowIndex,
          weekdays: group.weekdays,
          starts_at: window.starts_at,
          ends_at: window.ends_at,
          amount: window.amount,
        })),
      ).filter(canConflict);
      for (const pair of conflictPairs(flat)) {
        for (const index of [pair.left, pair.right]) {
          const item = flat[index];
          if (!item) continue;
          ctx.addIssue({
            code: "custom",
            path: ["day_groups", item.groupIndex, "windows", item.windowIndex, "amount"],
            message: messages.conflict,
          });
        }
      }
      const holidays = value.holiday_windows
        .map((window, index) => ({
          index,
          weekdays: [1],
          starts_at: window.starts_at,
          ends_at: window.ends_at,
          amount: window.amount,
        }))
        .filter(canConflict);
      for (const pair of conflictPairs(holidays)) {
        for (const index of [pair.left, pair.right]) {
          const item = holidays[index];
          if (!item) continue;
          ctx.addIssue({
            code: "custom",
            path: ["holiday_windows", item.index, "amount"],
            message: messages.conflict,
          });
        }
      }
    });
}

export type BranchPricingFormValues = z.infer<ReturnType<typeof branchPricingSchema>>;

export function durationChoices(slotUnit: number): number[] {
  const out: number[] = [];
  for (let minutes = slotUnit; minutes <= 240; minutes += slotUnit) {
    out.push(minutes);
  }
  return out;
}

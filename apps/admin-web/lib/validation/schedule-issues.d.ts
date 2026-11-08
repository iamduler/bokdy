export type ScheduleIssue =
  | "weekdays"
  | "clock"
  | "order"
  | "amount"
  | "conflict"
  | "overlap"
  | "duplicate";

export type ScheduleWindow = {
  weekdays: number[];
  starts_at: string;
  ends_at: string;
  amount: number;
};

export function scheduleIssues(windows: ScheduleWindow[]): ScheduleIssue[][];
export function blocksSave(issues: ScheduleIssue[]): boolean;
export function blocksPublish(issues: ScheduleIssue[]): boolean;
export function conflictPairs(windows: ScheduleWindow[]): { left: number; right: number }[];

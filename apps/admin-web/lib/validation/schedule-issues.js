/**
 * Client-side schedule checks. Overlapping windows with different prices match
 * the API conflict rule. Same-price overlaps and exact copies are flagged so
 * publish can stop without choosing a winner.
 *
 * @typedef {"weekdays" | "clock" | "order" | "amount" | "conflict" | "overlap" | "duplicate"} ScheduleIssue
 * @typedef {{ weekdays: number[], starts_at: string, ends_at: string, amount: number }} ScheduleWindow
 */

/** @param {string} value */
function toMinutes(value) {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value ?? "");
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

/** @param {number[]} days */
function dayKey(days) {
  return [...days].sort((a, b) => a - b).join(",");
}

/**
 * @param {ScheduleWindow[]} windows
 * @returns {ScheduleIssue[][]}
 */
export function scheduleIssues(windows) {
  /** @type {ScheduleIssue[][]} */
  const issues = windows.map(() => []);
  /** @type {Map<string, number>} */
  const seen = new Map();
  /** @type {{ index: number, day: number, start: number, end: number, amount: number }[]} */
  const spans = [];

  windows.forEach((window, index) => {
    const days = window.weekdays ?? [];
    if (days.length === 0) issues[index].push("weekdays");
    const start = toMinutes(window.starts_at);
    const end = toMinutes(window.ends_at);
    if (start == null || end == null) issues[index].push("clock");
    else if (end <= start) issues[index].push("order");
    if (!Number.isFinite(window.amount) || window.amount < 0) issues[index].push("amount");
    if (start == null || end == null || end <= start || days.length === 0) return;

    const key = `${dayKey(days)}|${start}|${end}|${window.amount}`;
    if (seen.has(key)) {
      issues[index].push("duplicate");
      const other = seen.get(key);
      if (other != null && !issues[other].includes("duplicate")) issues[other].push("duplicate");
    } else {
      seen.set(key, index);
    }
    for (const day of days) spans.push({ index, day, start, end, amount: window.amount });
  });

  for (let i = 0; i < spans.length; i += 1) {
    for (let j = i + 1; j < spans.length; j += 1) {
      const left = spans[i];
      const right = spans[j];
      if (left.index === right.index || left.day !== right.day) continue;
      if (!(left.start < right.end && right.start < left.end)) continue;
      const identical =
        left.start === right.start && left.end === right.end && left.amount === right.amount;
      if (identical) continue;
      const code = left.amount === right.amount ? "overlap" : "conflict";
      if (!issues[left.index].includes(code)) issues[left.index].push(code);
      if (!issues[right.index].includes(code)) issues[right.index].push(code);
    }
  }
  return issues;
}

const SAVE_BLOCKING = new Set(["weekdays", "clock", "order", "amount", "conflict"]);

/** @param {ScheduleIssue[]} issues */
export function blocksSave(issues) {
  return issues.some((issue) => SAVE_BLOCKING.has(issue));
}

/** @param {ScheduleIssue[]} issues */
export function blocksPublish(issues) {
  return issues.length > 0;
}

/**
 * Pairs of windows that overlap on a weekday with different prices.
 * @param {ScheduleWindow[]} windows
 * @returns {{ left: number, right: number }[]}
 */
export function conflictPairs(windows) {
  /** @type {{ left: number, right: number }[]} */
  const pairs = [];
  /** @type {{ index: number, day: number, start: number, end: number, amount: number }[]} */
  const spans = [];
  windows.forEach((window, index) => {
    const start = toMinutes(window.starts_at);
    const end = toMinutes(window.ends_at);
    if (start == null || end == null || end <= start) return;
    for (const day of window.weekdays ?? []) spans.push({ index, day, start, end, amount: window.amount });
  });
  const seen = new Set();
  for (let i = 0; i < spans.length; i += 1) {
    for (let j = i + 1; j < spans.length; j += 1) {
      const left = spans[i];
      const right = spans[j];
      if (left.index === right.index || left.day !== right.day) continue;
      if (!(left.start < right.end && right.start < left.end)) continue;
      if (left.amount === right.amount) continue;
      const key = left.index < right.index ? `${left.index}:${right.index}` : `${right.index}:${left.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ left: Math.min(left.index, right.index), right: Math.max(left.index, right.index) });
    }
  }
  return pairs;
}

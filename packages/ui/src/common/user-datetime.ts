export type UserDateFormat = "dmy" | "mdy" | "ymd";

export type UserDateTimePrefs = {
  dateFormat: UserDateFormat;
  timeZone: string;
};

export const DEFAULT_USER_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const DEFAULT_USER_DATETIME: UserDateTimePrefs = {
  dateFormat: "dmy",
  timeZone: DEFAULT_USER_TIME_ZONE,
};

export function userDateTimePrefs(
  dateFormat?: string | null,
  timeZone?: string | null,
): UserDateTimePrefs {
  const format: UserDateFormat =
    dateFormat === "mdy" || dateFormat === "ymd" || dateFormat === "dmy" ? dateFormat : "dmy";
  const zone = timeZone?.trim() || DEFAULT_USER_TIME_ZONE;
  return { dateFormat: format, timeZone: zone };
}

function pad(value: string) {
  return value.padStart(2, "0");
}

function joinDate(year: string, month: string, day: string, dateFormat: UserDateFormat) {
  if (dateFormat === "mdy") return `${month}-${day}-${year}`;
  if (dateFormat === "ymd") return `${year}-${month}-${day}`;
  return `${day}-${month}-${year}`;
}

/** Calendar date `YYYY-MM-DD`. Does not apply a timezone. */
export function formatUserDate(value: string, prefs: UserDateTimePrefs = DEFAULT_USER_DATETIME): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return value;
  return joinDate(match[1], match[2], match[3], prefs.dateFormat);
}

/** Wall-clock `H:mm` or `H:mm:ss`. Does not apply a timezone. Missing seconds become `00`. */
export function formatUserTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  if (!match) return value;
  return `${pad(match[1])}:${match[2]}:${pad(match[3] ?? "00")}`;
}

function zonedParts(value: string, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
  } catch {
    if (timeZone === DEFAULT_USER_TIME_ZONE) return null;
    return zonedParts(value, DEFAULT_USER_TIME_ZONE);
  }
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  let hour = read("hour");
  if (hour === "24") hour = "00";
  return {
    year: read("year"),
    month: pad(read("month")),
    day: pad(read("day")),
    hour: pad(hour),
    minute: pad(read("minute")),
    second: pad(read("second")),
  };
}

/** UTC instant rendered in the user timezone as `date HH:mm:ss`. */
export function formatUserDateTime(value: string, prefs: UserDateTimePrefs = DEFAULT_USER_DATETIME): string {
  const parts = zonedParts(value, prefs.timeZone);
  if (!parts) return value;
  return `${joinDate(parts.year, parts.month, parts.day, prefs.dateFormat)} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/** Clock of a UTC instant in the user timezone, `HH:mm:ss`. */
export function formatUserZonedTime(value: string, prefs: UserDateTimePrefs = DEFAULT_USER_DATETIME): string {
  const parts = zonedParts(value, prefs.timeZone);
  if (!parts) return value;
  return `${parts.hour}:${parts.minute}:${parts.second}`;
}

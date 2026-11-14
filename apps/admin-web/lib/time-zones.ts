export type TimezoneOption = {
  value: string;
  label: string;
  keywords: string;
  sortOrder: number;
};

/** Format current UTC offset for an IANA zone, e.g. "+7" or "+5:30". */
export function formatTimezoneOffset(timeZone: string, at = new Date()): string {
  try {
    const utc = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
    const local = new Date(at.toLocaleString("en-US", { timeZone }));
    const minutes = Math.round((local.getTime() - utc.getTime()) / 60_000);
    const sign = minutes >= 0 ? "+" : "-";
    const abs = Math.abs(minutes);
    const hours = Math.floor(abs / 60);
    const mins = abs % 60;
    if (mins === 0) return `${sign}${hours}`;
    return `${sign}${hours}:${String(mins).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export function timezoneLabel(name: string, at = new Date()): string {
  const offset = formatTimezoneOffset(name, at);
  return offset ? `${name} (${offset})` : name;
}

export function toTimezoneOptions(
  zones: { name: string; sort_order?: number }[],
  at = new Date(),
): TimezoneOption[] {
  return zones.map((zone) => {
    const label = timezoneLabel(zone.name, at);
    return {
      value: zone.name,
      label,
      keywords: `${zone.name} ${formatTimezoneOffset(zone.name, at)}`,
      sortOrder: zone.sort_order ?? 100,
    };
  });
}

/** Fallback when the reference catalog is unavailable. */
export function ianaTimeZones(): string[] {
  const preferred = "Asia/Ho_Chi_Minh";
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  const all =
    typeof intl.supportedValuesOf === "function"
      ? intl.supportedValuesOf("timeZone")
      : [preferred, "UTC"];
  return [preferred, ...all.filter((zone) => zone !== preferred)];
}

export function ianaTimezoneOptions(at = new Date()): TimezoneOption[] {
  return toTimezoneOptions(
    ianaTimeZones().map((name, index) => ({ name, sort_order: index })),
    at,
  );
}

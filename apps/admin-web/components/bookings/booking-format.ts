import { formatUserDateTime, type UserDateTimePrefs } from "@bokdy/ui";

export function bookingFormatters(locale: string, prefs: UserDateTimePrefs) {
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "VND" });
  return {
    money: (amount: number) => money.format(amount),
    when: (value: string) => formatUserDateTime(value, prefs),
  };
}

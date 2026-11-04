export function bookingFormatters(locale: string) {
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "VND" });
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return {
    money: (amount: number) => money.format(amount),
    when: (value: string) => when.format(new Date(value)),
  };
}

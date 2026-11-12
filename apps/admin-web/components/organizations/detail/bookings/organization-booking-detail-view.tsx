"use client";

import { formatUserDateTime, Spinner, useUserDateTimePrefs } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";

import { bookingFormatters } from "@/components/bookings/booking-format";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";
import { useOrganizationBooking } from "@/hooks/use-admin-bookings";
import { Link } from "@/i18n/navigation";

export function OrganizationBookingDetailView({
  bookingId,
}: {
  bookingId: string;
}) {
  const t = useTranslations("adminBookings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const prefs = useUserDateTimePrefs();
  const { orgId } = useOrganizationDetail();
  const query = useOrganizationBooking(orgId, bookingId);
  const format = bookingFormatters(locale, prefs);

  if (query.isLoading) {
    return (
      <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Spinner />
        {tc("loading")}
      </p>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <button
          type="button"
          className="mt-2 text-sm underline"
          onClick={() => void query.refetch()}
        >
          {tc("retry")}
        </button>
      </div>
    );
  }

  const { booking, invoice, payment } = query.data;
  const rows = [
    [t("fields.bookingNo"), booking.booking_no],
    [t("fields.status"), t(`statusLabel.${booking.status}`)],
    [t("fields.customer"), booking.customer_name ?? t("none")],
    [t("fields.email"), booking.customer_email ?? t("none")],
    [t("fields.organization"), booking.organization_name],
    [t("fields.branch"), booking.branch_name ?? t("none")],
    [t("fields.court"), booking.court_name ?? t("none")],
    [t("fields.starts"), format.when(booking.starts_at)],
    [t("fields.ends"), format.when(booking.ends_at)],
    [t("fields.total"), format.money(booking.total_amount)],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto soft-scrollbar p-4 md:p-6">
      <Link
        href={`/organizations/${orgId}/bookings`}
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground"
      >
        {t("back")}
      </Link>
      <section className="rounded-md border border-border bg-card/60">
        <dl className="grid sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="border-b border-border px-4 py-3 sm:odd:border-r"
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-md border border-border bg-card/60">
        <h2 className="border-b border-border px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {t("invoice")}
        </h2>
        {invoice ? (
          <dl className="grid sm:grid-cols-2">
            <Detail label={t("fields.invoiceNo")} value={invoice.invoice_no} />
            <Detail
              label={t("fields.invoiceStatus")}
              value={t(`invoiceStatus.${invoice.status}`)}
            />
            <Detail
              label={t("fields.total")}
              value={format.money(invoice.total_amount)}
            />
          </dl>
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">{t("none")}</p>
        )}
      </section>
      <section className="rounded-md border border-border bg-card/60">
        <h2 className="border-b border-border px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {t("payment")}
        </h2>
        {payment ? (
          <dl className="grid sm:grid-cols-2">
            <Detail
              label={t("fields.method")}
              value={t(`method.${payment.method}`)}
            />
            <Detail
              label={t("fields.paymentStatus")}
              value={t(`paymentStatus.${payment.status}`)}
            />
            <Detail
              label={t("fields.amount")}
              value={format.money(payment.amount)}
            />
          </dl>
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">{t("none")}</p>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border px-4 py-3 sm:odd:border-r">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

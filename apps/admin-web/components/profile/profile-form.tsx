"use client";

import { applyBokdyTheme, Button, Input, Label, THEME_STORAGE_KEY, type BokdyTheme } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useMe } from "@/hooks/use-me";
import { useUpdateMe } from "@/hooks/use-update-me";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { profileSchema, type ProfileFormValues } from "@/lib/validation/profile";

const THEMES: BokdyTheme[] = ["light", "dark", "system"];
const DATE_FORMATS = ["dmy", "mdy", "ymd"] as const;

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function formatVerifiedAt(iso: string | undefined, locale: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function ProfileForm() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const { data, isLoading, isError, refetch, isFetching } = useMe();
  const updateMe = useUpdateMe();
  const user = data?.user;

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const schema = useMemo(() => profileSchema({ currencyInvalid: te("INVALID") }), [te]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      theme: "system",
      date_format: "dmy",
      timezone: "",
      preferred_currency_code: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    reset({
      theme: (user.theme as BokdyTheme) ?? "system",
      date_format: (user.date_format as ProfileFormValues["date_format"]) ?? "dmy",
      timezone: user.timezone ?? "",
      preferred_currency_code: user.preferred_currency_code ?? "",
    });
  }, [user, reset]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{tc("loading")}</p>;
  }

  if (isError || !user) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {tc("retry")}
        </Button>
      </div>
    );
  }

  async function onSubmit(values: ProfileFormValues) {
    setError(null);
    setSaved(false);

    try {
      await updateMe.mutateAsync({
        theme: values.theme,
        date_format: values.date_format,
        timezone: values.timezone.trim() || undefined,
        preferred_currency_code: values.preferred_currency_code || undefined,
      });
      applyBokdyTheme(values.theme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, values.theme);
      } catch {
        /* ignore storage errors */
      }
      setSaved(true);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      setError(te(errorMessageKey(apiErr)));
    }
  }

  return (
    <form className="mx-auto max-w-lg space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4 rounded-lg border border-border p-4">
        <div className="space-y-1.5">
          <Label>{t("email")}</Label>
          <p className="text-sm">{user.email ?? "—"}</p>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <p className="font-medium text-foreground">{t("emailVerifiedAt")}</p>
            <p>{user.email_verified_at ? formatVerifiedAt(user.email_verified_at, locale) : t("notVerified")}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">{t("phoneVerifiedAt")}</p>
            <p>{user.phone_verified_at ? formatVerifiedAt(user.phone_verified_at, locale) : t("notVerified")}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-theme">{t("theme")}</Label>
          <select id="profile-theme" className={selectClass} {...register("theme")}>
            {THEMES.map((value) => (
              <option key={value} value={value}>
                {t(`themeOptions.${value}`)}
              </option>
            ))}
          </select>
          {errors.theme?.message ? <p className="text-sm text-destructive">{errors.theme.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-date-format">{t("dateFormat")}</Label>
          <select id="profile-date-format" className={selectClass} {...register("date_format")}>
            {DATE_FORMATS.map((value) => (
              <option key={value} value={value}>
                {t(`dateFormatOptions.${value}`)}
              </option>
            ))}
          </select>
          {errors.date_format?.message ? (
            <p className="text-sm text-destructive">{errors.date_format.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-timezone">{t("timezone")}</Label>
          <Input
            id="profile-timezone"
            placeholder={t("timezoneHint")}
            autoComplete="off"
            {...register("timezone")}
          />
          {errors.timezone?.message ? (
            <p className="text-sm text-destructive">{errors.timezone.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-currency">{t("preferredCurrencyCode")}</Label>
          <Input
            id="profile-currency"
            placeholder={t("currencyHint")}
            maxLength={3}
            autoComplete="off"
            {...register("preferred_currency_code")}
          />
          {errors.preferred_currency_code?.message ? (
            <p className="text-sm text-destructive">{errors.preferred_currency_code.message}</p>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("saved")}</p> : null}

      <Button type="submit" disabled={updateMe.isPending}>
        {t("save")}
      </Button>
    </form>
  );
}

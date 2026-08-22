"use client";

import { Combobox, Emoji } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { useLocales } from "@/hooks/use-locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

function isRoutableLocale(code: string): code is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(code);
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("switchers");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: locales, isLoading, isError } = useLocales();

  const options = useMemo(
    () =>
      (locales ?? [])
        .filter((item) => isRoutableLocale(item.code))
        .map((item) => ({
          value: item.code,
          keywords: `${item.code} ${item.native_name} ${item.name}`,
          label: item.native_name,
          leading: <Emoji emoji={item.emoji} size={16} />,
        })),
    [locales],
  );

  return (
    <Combobox
      variant="nav"
      className={className}
      aria-label={t("locale")}
      value={locale}
      options={options}
      disabled={isLoading || isError || options.length === 0}
      placeholder={isLoading ? "…" : locale}
      onValueChange={(code) => {
        if (!isRoutableLocale(code) || code === locale) return;
        router.replace(pathname, { locale: code });
      }}
    />
  );
}

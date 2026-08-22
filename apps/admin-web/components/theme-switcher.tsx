"use client";

import {
  applyBokdyTheme,
  Combobox,
  THEME_STORAGE_KEY,
  type BokdyTheme,
} from "@bokdy/ui";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useUpdateMe } from "@/hooks/use-update-me";

const THEMES: BokdyTheme[] = ["light", "dark", "system"];

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

function readStoredTheme(): BokdyTheme {
  if (typeof window === "undefined") return "system";
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* ignore */
  }
  return "system";
}

export function ThemeSwitcher({
  className,
  persistToProfile = false,
}: {
  className?: string;
  /** When true (authenticated shell), PATCH profile theme after local apply. */
  persistToProfile?: boolean;
}) {
  const t = useTranslations("switchers");
  const updateMe = useUpdateMe();
  const [theme, setTheme] = useState<BokdyTheme>("system");

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const options = useMemo(() => {
    const labels = {
      light: t("themeLight"),
      dark: t("themeDark"),
      system: t("themeSystem"),
    } as const;
    return THEMES.map((value) => {
      const Icon = THEME_ICONS[value];
      return {
        value,
        keywords: labels[value],
        label: labels[value],
        leading: <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />,
      };
    });
  }, [t]);

  function onChange(next: string) {
    if (!THEMES.includes(next as BokdyTheme)) return;
    const value = next as BokdyTheme;
    setTheme(value);
    applyBokdyTheme(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    if (persistToProfile) {
      void updateMe.mutateAsync({ theme: value }).catch(() => undefined);
    }
  }

  return (
    <Combobox
      variant="nav"
      className={className}
      aria-label={t("theme")}
      value={theme}
      options={options}
      onValueChange={onChange}
    />
  );
}

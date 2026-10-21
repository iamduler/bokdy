"use client";

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Emoji,
  applyBokdyTheme,
  cn,
  THEME_STORAGE_KEY,
  type BokdyTheme,
} from "@bokdy/ui";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Languages,
  Monitor,
  Moon,
  Palette,
  Sun,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useLogout } from "@/hooks/use-auth";
import { useLocales } from "@/hooks/use-locales";
import { useUpdateMe } from "@/hooks/use-update-me";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type MenuView = "root" | "locale" | "theme";

const THEMES: BokdyTheme[] = ["light", "dark", "system"];

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

function isRoutableLocale(
  code: string,
): code is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(code);
}

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

function initialsFrom(
  email: string | undefined,
  displayName: string | undefined,
): string {
  const name = displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "A";
}

export function UserMenu({
  email,
  displayName,
  layout = "header",
  greeting,
}: {
  email?: string;
  displayName?: string;
  layout?: "header" | "sidebar" | "header-greeting";
  greeting?: string;
}) {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const ts = useTranslations("switchers");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const updateMe = useUpdateMe();
  const { data: locales, isLoading: localesLoading } = useLocales();

  const [view, setView] = useState<MenuView>("root");
  const [theme, setTheme] = useState<BokdyTheme>("system");

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const localeOptions = useMemo(
    () =>
      (locales ?? []).filter((item) => isRoutableLocale(item.code)),
    [locales],
  );

  const currentLocaleLabel =
    localeOptions.find((item) => item.code === locale)?.native_name ?? locale;

  const themeLabels = {
    light: ts("themeLight"),
    dark: ts("themeDark"),
    system: ts("themeSystem"),
  } as const;

  const ThemeIcon = THEME_ICONS[theme];

  async function onLogout() {
    await logout.mutateAsync().catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  function onThemeChange(value: BokdyTheme) {
    setTheme(value);
    applyBokdyTheme(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    void updateMe.mutateAsync({ theme: value }).catch(() => undefined);
  }

  function onLocaleChange(code: string) {
    if (!isRoutableLocale(code) || code === locale) return;
    router.replace(pathname, { locale: code });
  }

  const initials = initialsFrom(email, displayName);
  const label = displayName?.trim() || email || t("profile");

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setView("root");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "group gap-2 px-1.5",
            layout === "sidebar"
              ? "h-12 w-full justify-start px-2 hover:bg-primary hover:text-primary-foreground data-[state=open]:bg-primary data-[state=open]:text-primary-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              : layout === "header-greeting"
                ? "h-auto rounded-full py-1 pl-1 pr-2.5 hover:bg-muted data-[state=open]:bg-muted"
                : "h-8 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
          )}
          aria-label={t("userMenu")}
        >
          <Avatar
            className={cn(
              layout === "header-greeting" ? "h-9 w-9" : "h-7 w-7",
              layout === "header-greeting" &&
                "ring-2 ring-transparent transition-shadow group-hover:ring-border group-data-[state=open]:ring-border",
            )}
          >
            <AvatarFallback
              className={cn(
                "font-semibold",
                layout === "header-greeting"
                  ? "bg-muted text-xs text-foreground"
                  : "bg-primary/15 text-[10px] text-primary",
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          {layout === "header-greeting" ? (
            <span className="hidden min-w-0 flex-col items-start text-left leading-tight sm:flex">
              {greeting ? (
                <span className="text-[10px] text-muted-foreground">{greeting}</span>
              ) : null}
              <span className="max-w-36 truncate text-xs font-semibold text-foreground">
                {label}
              </span>
            </span>
          ) : (
            <span
              className={cn(
                "max-w-40 truncate text-xs font-medium",
                layout === "sidebar" ? "group-data-[collapsible=icon]:hidden" : "hidden sm:inline",
              )}
            >
              {label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={layout === "sidebar" ? "start" : "end"}
        className="w-56 p-0"
      >
        {view === "root" ? (
          <div className="p-1">
              <DropdownMenuLabel className="space-y-0.5 font-normal">
                <p className="truncate text-sm font-semibold text-foreground">
                  {label}
                </p>
                {email && displayName?.trim() ? (
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">{t("nav.profile")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/sessions">{t("nav.sessions")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-between gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  setView("locale");
                }}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Languages className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{ts("locale")}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <span className="max-w-20 truncate">{currentLocaleLabel}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="justify-between gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  setView("theme");
                }}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Palette className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{ts("theme")}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <ThemeIcon className="h-3.5 w-3.5" />
                  <span className="max-w-16 truncate">{themeLabels[theme]}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={logout.isPending}
                onSelect={(event) => {
                  event.preventDefault();
                  void onLogout();
                }}
              >
                {tc("logout")}
              </DropdownMenuItem>
          </div>
        ) : (
          <div className="p-1">
              <DropdownMenuItem
                className="gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  setView("root");
                }}
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>{t("menuBack")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {view === "locale" ? (
                localesLoading ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">…</p>
                ) : (
                  localeOptions.map((item) => {
                    const active = item.code === locale;
                    return (
                      <DropdownMenuItem
                        key={item.code}
                        className="justify-between gap-2"
                        onSelect={(event) => {
                          event.preventDefault();
                          onLocaleChange(item.code);
                        }}
                      >
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <Emoji emoji={item.emoji} size={16} />
                          <span className="truncate">{item.native_name}</span>
                        </span>
                        {active ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })
                )
              ) : null}

              {view === "theme"
                ? THEMES.map((value) => {
                    const Icon = THEME_ICONS[value];
                    const active = value === theme;
                    return (
                      <DropdownMenuItem
                        key={value}
                        className={cn(
                          "justify-between gap-2",
                          active && "text-primary",
                        )}
                        onSelect={(event) => {
                          event.preventDefault();
                          onThemeChange(value);
                        }}
                      >
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{themeLabels[value]}</span>
                        </span>
                        {active ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })
                : null}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

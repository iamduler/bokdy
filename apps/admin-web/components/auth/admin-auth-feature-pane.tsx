"use client";

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { type ComponentType, type SVGProps, useEffect } from "react";

import {
  BadmintonIcon,
  BasketballIcon,
  FitnessIcon,
  SoccerIcon,
  TableTennisIcon,
  TennisIcon,
  TrophyIcon,
  VolleyballIcon,
} from "@/components/auth/admin-auth-orbit-icons";
import {
  preloadImage,
  useResolvedDarkScheme,
} from "@/hooks/use-resolved-dark-scheme";

/** Orbit hub mark — light PNG + dark-optimized asset. */
const FEATURE_CENTER_LOGO_LIGHT = "/apple-touch-icon.png";
const FEATURE_CENTER_LOGO_DARK = "/favicon-dark.png";

type SportIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

/**
 * Outer ring r=46 (inset 4%): 5 icons. Mid ring r=30 (inset 20%): 3 icons.
 * Literal % strings keep SSR/client HTML identical.
 */
const ORBIT_ITEMS: {
  Icon: SportIcon;
  left: string;
  top: string;
  key: string;
}[] = [
  // Outer — soccer, tennis, badminton, table tennis, volleyball
  { key: "soccer", Icon: SoccerIcon, left: "4.0000%", top: "50.0000%" },
  { key: "tennis", Icon: TennisIcon, left: "35.7852%", top: "6.2514%" },
  { key: "badminton", Icon: BadmintonIcon, left: "87.2148%", top: "22.9619%" },
  {
    key: "table-tennis",
    Icon: TableTennisIcon,
    left: "87.2148%",
    top: "77.0381%",
  },
  {
    key: "volleyball",
    Icon: VolleyballIcon,
    left: "35.7852%",
    top: "93.7486%",
  },
  // Mid — basketball, fitness, trophy
  {
    key: "basketball",
    Icon: BasketballIcon,
    left: "25.7295%",
    top: "32.3664%",
  },
  { key: "fitness", Icon: FitnessIcon, left: "77.4064%", top: "37.7979%" },
  { key: "trophy", Icon: TrophyIcon, left: "46.8641%", top: "79.8357%" },
];

function OrbitIcon({
  Icon,
  left,
  top,
}: {
  Icon: SportIcon;
  left: string;
  top: string;
}) {
  return (
    <span
      className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-shell-border bg-shell-card text-shell-accent shadow-sm"
      style={{ left, top }}
    >
      <Icon size={18} className="text-shell-accent" />
    </span>
  );
}

function FeatureCenterLogo() {
  const { ready, dark } = useResolvedDarkScheme();

  useEffect(() => {
    if (!ready) return;
    preloadImage(dark ? FEATURE_CENTER_LOGO_LIGHT : FEATURE_CENTER_LOGO_DARK);
  }, [ready, dark]);

  if (!ready) {
    return (
      <span
        aria-hidden
        className="h-full w-full animate-pulse rounded-full bg-shell-border/40"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={dark ? "dark" : "light"}
      src={dark ? FEATURE_CENTER_LOGO_DARK : FEATURE_CENTER_LOGO_LIGHT}
      alt=""
      width={96}
      height={96}
      decoding="async"
      className="h-full w-full object-cover"
    />
  );
}

/**
 * Right pane of admin auth split-diptych — orbit feature panel (lg+).
 */
export function AdminAuthFeaturePane() {
  const t = useTranslations("authShell");

  return (
    <aside
      className={cn(
        "relative flex min-h-112 flex-col overflow-hidden rounded-xl p-8 text-shell-text",
        "bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-sky-50 via-sky-100 to-sky-200",
        "dark:from-[#0c2744] dark:via-[#0f1929] dark:to-[#070d1c]",
      )}
      aria-label={t("featureAria")}
    >
      <header className="relative z-10 shrink-0 text-center">
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-shell-text">
          <span className="text-shell-accent">{t("featureTitle")} </span>
          <span className="text-shell-accent-secondary">
            {t("featureTitleAccent")}
          </span>
        </h2>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center py-6">
        <div
          className="relative aspect-square w-full max-w-72 overflow-visible sm:max-w-80"
          aria-hidden
        >
          {/* inset 4% / 20% / 38% → radii 46% / 30% / 12% */}
          <span className="absolute inset-[4%] rounded-full border border-shell-accent/20" />
          <span className="absolute inset-[20%] rounded-full border border-shell-accent/25" />
          <span className="absolute inset-[38%] rounded-full border border-shell-accent/30" />

          {ORBIT_ITEMS.map(({ key, Icon, left, top }) => (
            <OrbitIcon key={key} Icon={Icon} left={left} top={top} />
          ))}

          <span className="absolute p-4 left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border border-shell-border bg-shell-card shadow-md sm:h-24 sm:w-24">
            <FeatureCenterLogo />
          </span>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { Button, cn } from "@bokdy/ui";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { EntityAvatar } from "@/components/entity/avatar";
import { usePageShellLeading } from "@/components/shell/shell-title";
import { Link } from "@/i18n/navigation";

export function EntityDetailHero({
  backHref,
  backLabel,
  name,
  bannerSrc,
  logoSrc,
  onBannerError,
  onLogoError,
  avatarClassName,
  badges,
  subtitle,
  edit,
  intro,
  meta,
  kpis,
}: {
  backHref: string;
  backLabel: string;
  name: string;
  bannerSrc: string | null;
  logoSrc: string | null;
  onBannerError?: () => void;
  onLogoError?: () => void;
  avatarClassName?: string;
  badges?: ReactNode;
  subtitle?: ReactNode;
  edit?: ReactNode;
  intro?: ReactNode;
  meta?: ReactNode;
  kpis?: ReactNode;
}) {
  const back = usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link href={backHref} aria-label={backLabel}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  return (
    <>
      {back}
      <div className="soft-elevated overflow-hidden rounded-3xl border-0">
        <div
          className={cn(
            "relative aspect-3/1 w-full overflow-hidden",
            !bannerSrc &&
              "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]",
          )}
        >
          {bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerSrc} alt="" className="size-full object-cover" onError={onBannerError} />
          ) : null}
        </div>
        <div className="relative px-4 pb-3 md:px-5">
          <div className="-mt-10 mb-2 flex items-end gap-3 md:-mt-12 md:gap-4">
            <div
              className={cn(
                "relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-card bg-card shadow-sm md:size-28",
                avatarClassName,
              )}
            >
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="size-full object-cover" onError={onLogoError} />
              ) : (
                <EntityAvatar name={name} size="lg" className="size-full rounded-none" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-2 pb-0.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {name}
                  </h1>
                  {badges}
                </div>
                {subtitle ? <div className="mt-1.5">{subtitle}</div> : null}
              </div>
              {edit}
            </div>
          </div>
          {intro}
          {meta || kpis ? (
            <div className="mt-3 flex flex-col gap-2.5 border-t border-border/40 pt-2.5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 space-y-1 text-sm text-muted-foreground">{meta}</div>
              {kpis ? <div className="flex shrink-0 gap-5 sm:gap-6">{kpis}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function EntityDetailHeroMeta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 text-sky-600">{icon}</span>
      <span className="text-foreground/80">{children}</span>
    </p>
  );
}

export function EntityDetailHeroKpi({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: ReactNode }) {
  return (
    <div className="text-center sm:text-right">
      <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-end">
        {icon}
        {label}
      </p>
    </div>
  );
}

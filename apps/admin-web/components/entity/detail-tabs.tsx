"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI detail tabs
 */

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";
import { Link, useRouter } from "@/i18n/navigation";

export type EntityDetailTabItem = {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  /** Optional Soft count chip (e.g. subscriptions badge). */
  count?: number;
  /** Optional leading icon (vertical rail). */
  icon?: ReactNode;
};

type EntityDetailTabsProps = {
  tabs: EntityDetailTabItem[];
  ariaLabel?: string;
  className?: string;
  /** Optional section heading above a vertical rail. */
  title?: string;
  /**
   * `pill` — Soft UI segmented track (directories / org chrome).
   * `underline` — full-width horizontal content tabs.
   * `vertical` — left rail of content tabs (branch mockup).
   */
  variant?: "pill" | "underline" | "vertical";
};

function TabLabel({
  label,
  count,
  active,
  variant,
  icon,
}: {
  label: string;
  count?: number;
  active?: boolean;
  variant: NonNullable<EntityDetailTabsProps["variant"]>;
  icon?: ReactNode;
}) {
  return (
    <>
      {icon ? (
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{label}</span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
            variant === "pill"
              ? active
                ? "bg-white/20 text-white"
                : "bg-muted text-muted-foreground"
              : active
                ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </>
  );
}

function tabClassName(
  tab: EntityDetailTabItem,
  variant: NonNullable<EntityDetailTabsProps["variant"]>,
) {
  if (variant === "vertical") {
    return cn(
      "inline-flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      tab.disabled
        ? "cursor-not-allowed text-muted-foreground/50"
        : tab.active
          ? "bg-sky-500 text-white"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );
  }

  if (variant === "underline") {
    return cn(
      "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
      tab.disabled
        ? "cursor-not-allowed border-transparent text-muted-foreground/50"
        : tab.active
          ? "border-sky-500 text-sky-700 dark:text-sky-300"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
    );
  }

  return cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
    tab.disabled
      ? "cursor-not-allowed text-muted-foreground/50"
      : tab.active
        ? "bg-sky-500 text-white shadow-sm"
        : "text-muted-foreground hover:text-foreground",
  );
}

function DetailTabLink({
  tab,
  variant,
}: {
  tab: EntityDetailTabItem;
  variant: NonNullable<EntityDetailTabsProps["variant"]>;
}) {
  const classNameTab = tabClassName(tab, variant);
  const content: ReactNode = (
    <TabLabel
      label={tab.label}
      count={tab.count}
      active={tab.active}
      variant={variant}
      icon={tab.icon}
    />
  );

  if (tab.disabled || !tab.href) {
    return (
      <button
        type="button"
        role="tab"
        disabled
        aria-selected={false}
        className={classNameTab}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={tab.href}
      role="tab"
      aria-selected={tab.active}
      className={classNameTab}
    >
      {content}
    </Link>
  );
}

function DetailTabCombobox({
  tabs,
  ariaLabel,
}: {
  tabs: EntityDetailTabItem[];
  ariaLabel?: string;
}) {
  const router = useRouter();
  const active = tabs.find((tab) => tab.active && tab.href);
  const options: PopoverCommandOption[] = tabs.flatMap((tab) =>
    tab.href && !tab.disabled
      ? [
          {
            value: tab.href,
            label: typeof tab.count === "number" ? `${tab.label} ${tab.count}` : tab.label,
            keywords: tab.label,
            leading: tab.icon ? (
              <span className="inline-flex size-4 items-center justify-center [&_svg]:size-4" aria-hidden>
                {tab.icon}
              </span>
            ) : undefined,
          },
        ]
      : [],
  );

  return (
    <PopoverCommandSelect
      className="h-9 w-full min-w-0 px-2.5"
      aria-label={ariaLabel}
      align="start"
      value={active?.href ?? ""}
      options={options}
      placeholder={ariaLabel}
      onValueChange={(href) => {
        if (!href || href === active?.href) return;
        router.push(href);
      }}
    />
  );
}

/** Soft UI detail tabs — pill, underline, or vertical rail. */
export function EntityDetailTabs({
  tabs,
  ariaLabel,
  className,
  title,
  variant = "pill",
}: EntityDetailTabsProps) {
  const isVertical = variant === "vertical";

  if (isVertical) {
    return (
      <>
        <div className={cn("w-full min-w-0 md:hidden", className)}>
          <DetailTabCombobox tabs={tabs} ariaLabel={ariaLabel} />
        </div>
        <div className={cn("hidden w-full min-w-0 flex-col gap-2 p-2 md:flex", className)}>
          {title ? (
            <p className="px-3 pt-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {title}
            </p>
          ) : null}
          <div
            role="tablist"
            aria-label={ariaLabel}
            aria-orientation="vertical"
            className="flex w-full min-w-0 flex-col items-stretch gap-0.5"
          >
            {tabs.map((tab) => (
              <DetailTabLink key={tab.id} tab={tab} variant={variant} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 overflow-x-auto soft-scrollbar",
        variant === "underline" && "border-b border-border/50 px-4 md:px-6",
        variant === "pill" && "px-4 pb-2.5",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        className={cn(
          "inline-flex w-max max-w-full items-center",
          variant === "pill" &&
            "rounded-full border border-border/60 bg-card p-1 shadow-sm",
        )}
      >
        {tabs.map((tab) => (
          <DetailTabLink key={tab.id} tab={tab} variant={variant} />
        ))}
      </div>
    </div>
  );
}

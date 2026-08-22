"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AuthFormFrame({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-6 text-shell-text">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-shell-text-muted">{eyebrow}</p>
        ) : null}
        <h2 className="text-3xl font-black tracking-tight">{title}</h2>
        {description ? <p className="text-sm leading-6 text-shell-text-muted">{description}</p> : null}
      </div>
      {children}
      {footer ? <div>{footer}</div> : null}
    </div>
  );
}

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  labelExtra?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
};

export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ label, labelExtra, hint, error, className, ...props }, ref) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-[11px] font-bold uppercase tracking-[0.14em] text-shell-text-muted">{label}</Label>
          {labelExtra}
        </div>
        <Input
          ref={ref}
          className={cn(
            "h-12 rounded-xl border-shell-border bg-shell-card text-shell-text placeholder:text-shell-text-muted focus-visible:ring-shell-accent",
            error ? "border-rose-500/60 ring-1 ring-rose-500/25" : "hover:border-shell-border-strong",
            className,
          )}
          {...props}
        />
        {hint ? <p className="text-xs text-shell-text-muted">{hint}</p> : null}
        {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      </div>
    );
  },
);

type AuthPasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  labelExtra?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
};

export const AuthPasswordField = React.forwardRef<HTMLInputElement, AuthPasswordFieldProps>(
  function AuthPasswordField({ label, labelExtra, hint, error, className, ...props }, ref) {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-[11px] font-bold uppercase tracking-[0.14em] text-shell-text-muted">{label}</Label>
          {labelExtra}
        </div>
        <div
          className={cn(
            "flex h-12 items-center rounded-xl border bg-shell-card focus-within:ring-2 focus-within:ring-shell-accent",
            error ? "border-rose-500/60 ring-1 ring-rose-500/25" : "border-shell-border hover:border-shell-border-strong",
            className,
          )}
        >
          <Input
            ref={ref}
            type={visible ? "text" : "password"}
            className="h-full border-0 bg-transparent text-shell-text shadow-none focus-visible:ring-0"
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="px-3 text-shell-text-muted transition-colors hover:text-shell-text"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {hint ? <p className="text-xs text-shell-text-muted">{hint}</p> : null}
        {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      </div>
    );
  },
);

export function AuthAlert({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-shell-border bg-shell-card text-shell-text-muted",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200",
    danger: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200",
  } as const;

  return <div className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}

export function AuthOptionCard({
  title,
  description,
  icon,
  badge,
  onClick,
  className,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border border-shell-border bg-shell-card p-4 text-left transition-colors hover:border-shell-border-strong",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-shell-accent-soft text-shell-accent">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-shell-text">{title}</span>
          {badge}
        </div>
        <p className="mt-1 text-xs leading-5 text-shell-text-muted">{description}</p>
      </div>
      <span className="text-lg text-shell-text-muted">›</span>
    </button>
  );
}

export function SecurityRiskBadge({
  level,
  labels,
}: {
  level: "low" | "medium" | "high";
  labels?: Partial<Record<"low" | "medium" | "high", string>>;
}) {
  const tones = {
    low: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    medium: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    high: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  } as const;

  return (
    <span className={cn("inline-flex rounded-md px-2 py-1 text-[11px] font-bold", tones[level])}>
      {labels?.[level] ?? level}
    </span>
  );
}

export function AuthActionButton({
  tone = "primary",
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  tone?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const classes = {
    primary: "h-12 rounded-xl bg-shell-accent text-white hover:bg-shell-accent/90",
    secondary:
      "h-12 rounded-xl border border-shell-border bg-shell-card text-shell-text hover:bg-black/[0.04] dark:hover:bg-white/5",
    ghost:
      "h-12 rounded-xl bg-transparent text-shell-text-muted hover:bg-black/[0.04] hover:text-shell-text dark:hover:bg-white/5",
    danger:
      "h-12 rounded-xl border border-rose-500/25 bg-rose-500/12 text-rose-700 hover:bg-rose-500/18 dark:text-rose-200",
  } as const;

  return <Button className={cn("w-full font-semibold", classes[tone], className)} {...props} />;
}

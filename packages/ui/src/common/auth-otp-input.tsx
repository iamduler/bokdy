"use client";

import * as React from "react";

import { cn } from "../lib/utils";

export function AuthOtpInput({
  value,
  onChange,
  length = 6,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
  className?: string;
}) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = Array.from({ length }, (_, i) => value[i] ?? "");
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !(value[index] ?? "") && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className={cn("flex items-center justify-center gap-2.5", className)}>
      {Array.from({ length }).map((_, index) => {
        const filled = Boolean(value[index]);
        return (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={value[index] ?? ""}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(index, event)}
            className={cn(
              "h-14 w-12 rounded-xl border-2 bg-shell-card text-center text-xl font-bold tracking-wide text-shell-text outline-none transition-colors",
              filled
                ? "border-shell-accent bg-shell-accent-soft"
                : "border-shell-border focus:border-shell-border-strong",
            )}
          />
        );
      })}
    </div>
  );
}

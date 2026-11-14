"use client";

import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { enUS, vi } from "react-day-picker/locale";

import { formatUserDate } from "../common/user-datetime";
import { useUserDateTimePrefs } from "../common/user-datetime-context";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type DatePickerProps = {
  id?: string;
  /** `YYYY-MM-DD`, or empty when unset. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** BCP 47 language, used for the calendar month names. The button label uses the user date format. */
  locale?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  className?: string;
  /** First navigable month (defaults to Jan of current year − 100). */
  startMonth?: Date;
  /** Last navigable month (defaults to Dec of current year + 10). */
  endMonth?: Date;
  /** Days after this calendar date cannot be selected (inclusive bound). */
  maxDate?: Date;
};

function parseISODate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function calendarLocale(locale: string | undefined) {
  return locale?.toLowerCase().startsWith("vi") ? vi : enUS;
}

/** Module-stable defaults — new Date() each render remounts caption Selects. */
const DEFAULT_START_YEAR = new Date().getFullYear() - 100;
const DEFAULT_END_YEAR = new Date().getFullYear() + 10;
const CALENDAR_START_MONTH = new Date(DEFAULT_START_YEAR, 0);
const CALENDAR_END_MONTH = new Date(DEFAULT_END_YEAR, 11);

/** DOB-friendly bounds: Jan 1920 … current month. */
export const DATE_PICKER_BIRTH_START_MONTH = new Date(1920, 0);
export const DATE_PICKER_BIRTH_END_MONTH = (() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth());
})();

/** Local calendar date at 00:00 — use for DOB `maxDate` / Zod “not in the future”. */
export function datePickerToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function datePickerTodayISO(): string {
  return toISODate(datePickerToday());
}

/** Grace after caption Select closes so late focus/pointer events do not dismiss the Popover. */
const CAPTION_SELECT_DISMISS_GRACE_MS = 150;

function isSelectPortalTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest("[data-slot=select-content]") || target.closest("[data-radix-select-viewport]"),
    )
  );
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  {
    id,
    value,
    onChange,
    placeholder,
    locale,
    disabled,
    className,
    "aria-label": ariaLabel,
    "aria-invalid": ariaInvalid,
    startMonth = CALENDAR_START_MONTH,
    endMonth = CALENDAR_END_MONTH,
    maxDate,
  },
  ref,
) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const captionSelectOpenRef = React.useRef(false);
  const dismissGraceUntilRef = React.useRef(0);
  const [open, setOpen] = React.useState(false);
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const selected = React.useMemo(() => parseISODate(value), [value]);
  const [month, setMonth] = React.useState<Date>(() => selected ?? new Date());
  const prefs = useUserDateTimePrefs();
  const label = selected ? formatUserDate(value, prefs) : "";
  const dayPickerLocale = React.useMemo(() => calendarLocale(locale), [locale]);
  const dayDisabled = React.useMemo(
    () => (maxDate ? { after: maxDate } : undefined),
    [maxDate],
  );

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

  React.useEffect(() => {
    if (!open) return;
    setContainer(triggerRef.current?.closest<HTMLElement>("[role='dialog']") ?? null);
    // Sync caption month when the popover opens or the committed value changes — not on every month nav.
    setMonth(parseISODate(value) ?? new Date());
  }, [open, value]);

  const shouldBlockDismiss = React.useCallback((target: EventTarget | null) => {
    return (
      isSelectPortalTarget(target) ||
      captionSelectOpenRef.current ||
      Date.now() < dismissGraceUntilRef.current
    );
  }, []);

  const handleCaptionSelectOpenChange = React.useCallback((selectOpen: boolean) => {
    captionSelectOpenRef.current = selectOpen;
    if (!selectOpen) {
      dismissGraceUntilRef.current = Date.now() + CAPTION_SELECT_DISMISS_GRACE_MS;
    }
  }, []);

  const handleOpenChange = React.useCallback((next: boolean) => {
    if (
      !next &&
      (captionSelectOpenRef.current || Date.now() < dismissGraceUntilRef.current)
    ) {
      return;
    }
    setOpen(next);
  }, []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          ref={triggerRef}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid || undefined}
          className={cn(
            "h-9 w-full justify-start gap-2 border-input bg-background px-3 font-normal text-foreground shadow-xs",
            "hover:border-sky-400 hover:bg-background! hover:text-foreground!",
            "dark:bg-input/30 dark:hover:border-sky-400 dark:hover:bg-input/30! dark:hover:text-foreground!",
            !label && "text-muted-foreground hover:text-muted-foreground!",
            className,
          )}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className={cn("truncate", label ? "text-foreground" : "text-muted-foreground")}>{label || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        align="start"
        className="w-auto p-0"
        data-slot="popover-content"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onWheel={(event) => event.stopPropagation()}
        onInteractOutside={(event) => {
          if (shouldBlockDismiss(event.target)) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (shouldBlockDismiss(event.target)) event.preventDefault();
        }}
        onFocusOutside={(event) => {
          if (shouldBlockDismiss(event.target)) event.preventDefault();
        }}
      >
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={dayDisabled}
          locale={dayPickerLocale}
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          onCaptionSelectOpenChange={handleCaptionSelectOpenChange}
          onSelect={(date) => {
            if (!date) return;
            onChange(toISODate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
});

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
  },
  ref,
) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const selected = parseISODate(value);
  const prefs = useUserDateTimePrefs();
  const label = selected ? formatUserDate(value, prefs) : "";

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

  React.useEffect(() => {
    if (!open) return;
    setContainer(triggerRef.current?.closest<HTMLElement>("[role='dialog']") ?? null);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
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
        onWheel={(event) => event.stopPropagation()}
      >
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={new Date(1920, 0)}
          endMonth={new Date(2100, 11)}
          locale={calendarLocale(locale)}
          selected={selected}
          defaultMonth={selected}
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

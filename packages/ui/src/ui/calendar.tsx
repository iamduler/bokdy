"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import * as React from "react";
import { DayPicker, type ChevronProps, type DayButtonProps, type DropdownProps } from "react-day-picker";

import { cn } from "../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

function CalendarChevron({ orientation, className }: ChevronProps) {
  const icon = cn("size-4", className);
  if (orientation === "left") return <ChevronLeft className={icon} />;
  if (orientation === "right") return <ChevronRight className={icon} />;
  if (orientation === "up") return <ChevronUp className={icon} />;
  return <ChevronDown className={icon} />;
}

function CalendarDropdown({
  options,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const current = value == null || value === "" ? undefined : String(value);

  React.useLayoutEffect(() => {
    const node = triggerRef.current;
    setContainer(
      node?.closest<HTMLElement>("[data-radix-popper-content-wrapper]") ??
        node?.closest<HTMLElement>("[role='dialog']") ??
        null,
    );
  }, []);

  return (
    <Select
      value={current}
      disabled={disabled}
      onValueChange={(next) => {
        onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger ref={triggerRef} size="sm" aria-label={ariaLabel} className="h-8 gap-1 px-2 font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent container={container} className="select-caption max-h-60">
        {options?.map((option) => (
          <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CalendarDayButton({ day: _day, modifiers, className, ...props }: DayButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        modifiers.selected && "bg-primary text-primary-foreground hover:bg-primary",
        modifiers.today && !modifiers.selected && "ring-1 ring-primary",
        modifiers.outside && !modifiers.selected && "text-muted-foreground",
        modifiers.disabled && "pointer-events-none opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function Calendar({
  className,
  classNames,
  captionLayout = "label",
  formatters,
  locale,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const localeCode = locale && "code" in locale ? locale.code : undefined;

  return (
    <DayPicker
      showOutsideDays
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (month) => month.toLocaleString(localeCode, { month: "short" }),
        ...formatters,
      }}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col",
        month: "flex flex-col gap-2",
        month_caption: "flex h-8 w-full items-center justify-center px-8",
        dropdowns: "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
        caption_label: "text-sm font-medium select-none",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between",
        button_previous:
          "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40",
        button_next:
          "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40",
        month_grid: "w-full border-collapse",
        weekday: "size-8 pb-1 text-center text-xs font-normal text-muted-foreground",
        day: "p-0 text-center",
        ...classNames,
      }}
      components={{
        Chevron: CalendarChevron,
        DayButton: CalendarDayButton,
        Dropdown: CalendarDropdown,
        ...components,
      }}
      {...props}
    />
  );
}

"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import * as React from "react";
import { DayPicker, type ChevronProps, type DayButtonProps, type DropdownProps } from "react-day-picker";

import { cn } from "../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const CaptionSelectOpenContext = React.createContext<((open: boolean) => void) | undefined>(undefined);

const CALENDAR_CLASS_NAMES = {
  root: "w-fit",
  months: "relative flex flex-col",
  month: "flex flex-col gap-2",
  month_caption: "relative z-10 flex h-8 w-full items-center justify-center px-8",
  dropdowns: "relative z-10 flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
  caption_label: "text-sm font-medium select-none",
  // Full-width nav sits over the caption — disable hits except on the chevron buttons.
  nav: "absolute inset-x-0 top-0 z-20 flex w-full items-center justify-between pointer-events-none",
  button_previous:
    "pointer-events-auto inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40",
  button_next:
    "pointer-events-auto inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40",
  month_grid: "w-full border-collapse",
  weekday: "size-8 pb-1 text-center text-xs font-normal text-muted-foreground",
  day: "p-0 text-center",
} as const;

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
  const onCaptionSelectOpenChange = React.useContext(CaptionSelectOpenContext);
  const [open, setOpen] = React.useState(false);
  const current = value == null || value === "" ? undefined : String(value);

  // When closed, keep only the selected item so SelectValue still labels the trigger
  // without reconciling ~100+ year options on every DayPicker re-render.
  const visibleOptions = open
    ? options
    : options?.filter((option) => String(option.value) === current);

  return (
    <Select
      value={current}
      disabled={disabled}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onCaptionSelectOpenChange?.(next);
      }}
      onValueChange={(next) => {
        onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger size="sm" aria-label={ariaLabel} className="h-8 max-w-[7.5rem] gap-1 px-2 font-medium">
        <SelectValue />
      </SelectTrigger>
      {/* Portal to body — nesting inside the DatePicker popover remounts/clips the list. */}
      <SelectContent className="select-caption z-[80] max-h-60">
        {visibleOptions?.map((option) => (
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

const CALENDAR_COMPONENTS = {
  Chevron: CalendarChevron,
  DayButton: CalendarDayButton,
  Dropdown: CalendarDropdown,
};

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /** Fired when a caption Month/Year Select opens or closes (DatePicker dismiss guard). */
  onCaptionSelectOpenChange?: (open: boolean) => void;
};

export function Calendar({
  className,
  classNames,
  captionLayout = "label",
  formatters,
  locale,
  components,
  onCaptionSelectOpenChange,
  ...props
}: CalendarProps) {
  const localeCode = locale && "code" in locale ? locale.code : undefined;

  const mergedFormatters = React.useMemo(
    () => ({
      formatMonthDropdown: (month: Date) => month.toLocaleString(localeCode, { month: "short" }),
      ...formatters,
    }),
    [localeCode, formatters],
  );

  const mergedClassNames = React.useMemo(
    () => ({
      ...CALENDAR_CLASS_NAMES,
      ...classNames,
    }),
    [classNames],
  );

  const mergedComponents = React.useMemo(
    () => ({
      ...CALENDAR_COMPONENTS,
      ...components,
    }),
    [components],
  );

  return (
    <CaptionSelectOpenContext.Provider value={onCaptionSelectOpenChange}>
      <DayPicker
        showOutsideDays
        captionLayout={captionLayout}
        locale={locale}
        formatters={mergedFormatters}
        className={cn("p-3", className)}
        classNames={mergedClassNames}
        components={mergedComponents}
        {...props}
      />
    </CaptionSelectOpenContext.Provider>
  );
}

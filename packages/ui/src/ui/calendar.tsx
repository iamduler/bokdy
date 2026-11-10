"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import * as React from "react";
import { DayPicker, type ChevronProps, type DayButtonProps } from "react-day-picker";

import { cn } from "../lib/utils";

function CalendarChevron({ orientation, className }: ChevronProps) {
  const icon = cn("size-4", className);
  if (orientation === "left") return <ChevronLeft className={icon} />;
  if (orientation === "right") return <ChevronRight className={icon} />;
  if (orientation === "up") return <ChevronUp className={icon} />;
  return <ChevronDown className={icon} />;
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

export function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "relative",
        month: "flex flex-col gap-2",
        month_caption: "flex h-8 items-center justify-center px-8 text-sm font-medium",
        caption_label: "text-sm font-medium capitalize",
        nav: "absolute inset-x-0 top-0 z-10 flex items-center justify-between",
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
      }}
      {...props}
    />
  );
}

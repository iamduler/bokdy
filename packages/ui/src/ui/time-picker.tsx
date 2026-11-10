"use client";

import { Clock } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";

export type TimePickerProps = {
  id?: string;
  /** `HH:MM`, or empty when unset. Seconds are ignored. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hourLabel: string;
  minuteLabel: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  className?: string;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));

function parseTime(value: string): { hour: string; minute: string } | undefined {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value);
  if (!match) return undefined;
  return { hour: match[1], minute: match[2] };
}

function TimeColumn({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>("[data-active='true']")?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <ScrollArea ref={listRef} className="h-56 w-14">
      <div role="listbox" aria-label={label} className="p-1">
      {values.map((item) => {
        const active = item === selected;
        return (
          <button
            key={item}
            type="button"
            role="option"
            data-active={active || undefined}
            aria-selected={active}
            className={cn(
              "flex h-8 w-full items-center justify-center rounded-md text-sm tabular-nums",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
            onClick={() => onSelect(item)}
          >
            {item}
          </button>
        );
      })}
      </div>
    </ScrollArea>
  );
}

export const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
  {
    id,
    value,
    onChange,
    onBlur,
    placeholder,
    hourLabel,
    minuteLabel,
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
  const parsed = parseTime(value);

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

  React.useEffect(() => {
    if (!open) return;
    setContainer(triggerRef.current?.closest<HTMLElement>("[role='dialog']") ?? null);
  }, [open]);

  function choose(part: "hour" | "minute", next: string) {
    const hour = part === "hour" ? next : (parsed?.hour ?? "00");
    const minute = part === "minute" ? next : (parsed?.minute ?? "00");
    onChange(`${hour}:${minute}`);
    if (part === "minute") setOpen(false);
  }

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
          onBlur={onBlur}
          className={cn(
            "h-9 w-full justify-start gap-2 border-input bg-background px-3 font-normal text-foreground shadow-xs hover:bg-background hover:text-foreground dark:bg-input/30 dark:hover:bg-input/30",
            !parsed && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="size-4 text-muted-foreground" />
          <span className="truncate tabular-nums">{parsed ? `${parsed.hour}:${parsed.minute}` : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        align="start"
        className="w-auto p-0"
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="flex divide-x divide-border">
          <TimeColumn label={hourLabel} values={HOURS} selected={parsed?.hour ?? ""} onSelect={(hour) => choose("hour", hour)} />
          <TimeColumn
            label={minuteLabel}
            values={MINUTES}
            selected={parsed?.minute ?? ""}
            onSelect={(minute) => choose("minute", minute)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
});

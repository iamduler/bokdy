"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ComboboxOption = {
  value: string;
  /** Plain text label (also used for cmdk filter with keywords) */
  label: string;
  /** Plain text used by cmdk filter */
  keywords: string;
  /** Leading icon / flag shown in trigger + row */
  leading?: React.ReactNode;
};

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  "aria-label": ariaLabel,
  className,
  align = "end",
  searchable = false,
  /** Nav switcher layout (locale/theme): Bokdy chip trigger, sm: label, check on selected */
  variant = "default",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  align?: "start" | "center" | "end";
  searchable?: boolean;
  variant?: "default" | "nav";
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);
  const isNav = variant === "nav";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={isNav ? "outline" : "ghost"}
          size="sm"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            isNav
              ? "h-auto min-w-0 gap-1.5 rounded-lg border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-none hover:border-primary/40 hover:bg-muted/60 data-[state=open]:border-primary data-[state=open]:bg-muted/60 data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
              : "min-w-[8.5rem] justify-between gap-2 font-normal",
            className,
          )}
        >
          {selected?.leading ? (
            <span className="inline-flex shrink-0 items-center">{selected.leading}</span>
          ) : null}
          <span
            className={cn(
              "min-w-0 truncate",
              isNav ? "hidden sm:inline" : "flex-1 text-left",
            )}
          >
            {selected?.label ?? placeholder ?? "…"}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isNav
                ? open
                  ? "text-primary"
                  : "text-muted-foreground"
                : "text-muted-foreground",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "p-0 shadow-lg",
          isNav
            ? "w-auto min-w-[var(--radix-popover-trigger-width)] max-w-[14rem] overflow-hidden rounded-xl border-border bg-popover"
            : "w-[var(--radix-popover-trigger-width)] min-w-[10rem]",
        )}
      >
        <Command className={isNav ? "bg-popover" : undefined}>
          {searchable ? <CommandInput placeholder={searchPlaceholder} /> : null}
          <CommandList>
            <CommandEmpty>{emptyText ?? "—"}</CommandEmpty>
            <CommandGroup className={isNav ? "p-1" : undefined}>
              {options.map((option) => {
                const isActive = value === option.value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.keywords}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      isNav &&
                        "group gap-2 rounded-md px-3 py-2 text-xs font-semibold data-[selected=true]:bg-muted",
                      isActive &&
                        isNav &&
                        "bg-primary/10 text-primary data-[selected=true]:bg-primary/15",
                    )}
                  >
                    {option.leading ? (
                      <span className="inline-flex shrink-0 items-center group-hover:text-accent">
                        {option.leading}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@bokdy/ui";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

export type PopoverCommandOption = {
  value: string;
  label: string;
  keywords: string;
  leading?: React.ReactNode;
};

type PopoverCommandSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: PopoverCommandOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  align?: "start" | "center" | "end";
  searchable?: boolean;
  /** Nav switcher chip layout (locale/theme). */
  variant?: "default" | "nav";
};

/**
 * App composition of shadcn Popover + Command + Button (classic combobox pattern).
 * Not a packages/ui primitive — keep nav/filter chrome here.
 */
export function PopoverCommandSelect({
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
  variant = "default",
}: PopoverCommandSelectProps) {
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
              ? "h-auto min-w-0 gap-1.5 rounded-md border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-none hover:border-primary/50 hover:bg-primary/10! hover:text-foreground! data-[state=open]:border-primary data-[state=open]:bg-primary/10! data-[state=open]:text-foreground! data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
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
                        "group gap-2 rounded-md px-3 py-2 text-xs font-semibold text-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
                      isActive &&
                        isNav &&
                        "bg-primary/10 text-primary data-[selected=true]:bg-primary/15 data-[selected=true]:text-primary",
                    )}
                  >
                    {option.leading ? (
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-data-[selected=true]:text-foreground",
                        )}
                      >
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

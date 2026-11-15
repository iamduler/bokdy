"use client";

import { cn } from "@bokdy/ui";

import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";

import { softFilterControl } from "./index";

export function FilterSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  placeholder,
  searchPlaceholder,
  emptyText,
  searchable,
  align = "start",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: PopoverCommandOption[];
  ariaLabel: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  searchable?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <PopoverCommandSelect
      value={value}
      onValueChange={onValueChange}
      options={options}
      aria-label={ariaLabel}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      searchable={searchable}
      align={align}
      className={cn(
        "h-8 min-w-[8.5rem] justify-between px-2.5 text-xs font-medium",
        softFilterControl,
        className,
      )}
    />
  );
}

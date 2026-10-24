"use client";

import {
  Badge,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  Popover,
  PopoverAnchor,
  PopoverContent,
  cn,
} from "@bokdy/ui";
import { Check, X } from "lucide-react";
import * as React from "react";

import type { PopoverCommandOption } from "@/components/popover-command-select";
import { normalizeForSearch } from "@/lib/text/vietnamese-ascii";

type PopoverCommandMultiSelectProps = {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: PopoverCommandOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  align?: "start" | "center" | "end";
  searchable?: boolean;
};

/**
 * Multi-select with chips + filter, composed from Popover + Command + Badge
 * (Radix stack — same UX idea as shadcn Combobox Multiple chips).
 */
export function PopoverCommandMultiSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  "aria-label": ariaLabel,
  className,
  align = "start",
  searchable = true,
}: PopoverCommandMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const selected = options.filter((option) => value.includes(option.value));
  const filtered = options.filter((option) => {
    if (!query.trim()) return true;
    const q = normalizeForSearch(query);
    return (
      normalizeForSearch(option.label).includes(q) ||
      normalizeForSearch(option.keywords).includes(q) ||
      normalizeForSearch(option.value).includes(q)
    );
  });

  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((item) => item !== optionValue));
      return;
    }
    onValueChange([...value, optionValue]);
  }

  function remove(optionValue: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onValueChange(value.filter((item) => item !== optionValue));
    inputRef.current?.focus();
  }

  function isInsideAnchor(target: EventTarget | null) {
    return target instanceof Node && Boolean(anchorRef.current?.contains(target));
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-disabled={disabled || undefined}
          data-disabled={disabled || undefined}
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs transition-[color,box-shadow] outline-none",
            "focus-within:border-shell-accent focus-within:ring-[3px] focus-within:ring-shell-accent/50",
            disabled && "pointer-events-none cursor-not-allowed opacity-50",
            className,
          )}
          onMouseDown={(event) => {
            if (disabled) return;
            // Keep focus on the filter input; open the list.
            if ((event.target as HTMLElement).closest("[data-chip-remove]")) return;
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
        >
          {selected.map((option) => (
            <Badge
              key={option.value}
              variant="default"
              className="max-w-full gap-1 border-transparent bg-primary py-0.5 pr-1 font-medium text-primary-foreground"
            >
              <span className="min-w-0 truncate">{option.label}</span>
              <button
                type="button"
                data-chip-remove
                aria-label={`Remove ${option.label}`}
                disabled={disabled}
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
                onMouseDown={(event) => remove(option.value, event)}
              >
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
          {searchable ? (
            <input
              ref={inputRef}
              type="text"
              value={query}
              disabled={disabled}
              placeholder={selected.length === 0 ? (placeholder ?? "…") : (searchPlaceholder ?? "")}
              aria-label={ariaLabel}
              className="min-w-24 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              onChange={(event) => {
                setQuery(event.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => {
                if (!disabled) setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !query && value.length > 0) {
                  onValueChange(value.slice(0, -1));
                }
                if (event.key === "Escape") {
                  setOpen(false);
                  setQuery("");
                }
              }}
            />
          ) : selected.length === 0 ? (
            <span className="px-1 text-sm text-muted-foreground">{placeholder ?? "…"}</span>
          ) : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align={align}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onFocusOutside={(event) => {
          // Chips input lives in the anchor (outside content). Focusing it after
          // a select must not dismiss the list — multi-select stays open.
          if (isInsideAnchor(event.target)) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (isInsideAnchor(event.target)) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (isInsideAnchor(event.target)) {
            event.preventDefault();
          }
        }}
        className="w-(--radix-popover-trigger-width) min-w-48 p-0 shadow-lg"
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>{emptyText ?? "—"}</CommandEmpty>
            <CommandGroup>
              {filtered.map((option) => {
                const isActive = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.keywords}
                    onSelect={() => {
                      toggle(option.value);
                      setQuery("");
                      setOpen(true);
                      requestAnimationFrame(() => inputRef.current?.focus());
                    }}
                  >
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

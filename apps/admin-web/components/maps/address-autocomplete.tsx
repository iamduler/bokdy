"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverAnchor,
  PopoverContent,
  cn,
} from "@bokdy/ui";
import { Loader2, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { useMapsAutocomplete } from "@/hooks/use-maps";
import { getPlace, type MapsPlaceDetail, type MapsPlaceSuggestion } from "@/lib/api/maps";

/** Sheet/Dialog content — portal here so RemoveScroll does not block list wheel scroll. */
function nearestDialogContent(from: HTMLElement | null): HTMLElement | null {
  return from?.closest('[role="dialog"]') ?? null;
}

type AddressAutocompleteProps = {
  value: string;
  onValueChange: (value: string) => void;
  onPlaceSelect: (place: MapsPlaceDetail) => void;
  focusLat?: number;
  focusLng?: number;
  placeholder?: string;
  emptyLabel?: string;
  minCharsLabel?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  id?: string;
  className?: string;
};

export function AddressAutocomplete({
  value,
  onValueChange,
  onPlaceSelect,
  focusLat,
  focusLng,
  placeholder,
  emptyLabel = "—",
  minCharsLabel = "…",
  disabled,
  required,
  "aria-invalid": ariaInvalid,
  id,
  className,
}: AddressAutocompleteProps) {
  const listId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [resolving, setResolving] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    setPortalContainer(nearestDialogContent(anchorRef.current));
  }, [open]);

  const debounced = useDebounced(query.trim(), 300);
  const { data: suggestions = [], isFetching } = useMapsAutocomplete({
    q: debounced,
    lat: focusLat,
    lng: focusLng,
    enabled: open && debounced.length >= 2,
  });

  async function pick(suggestion: MapsPlaceSuggestion) {
    setResolving(true);
    try {
      const place = await getPlace(suggestion.ref_id);
      const line = place.address_line || place.display || suggestion.display;
      setQuery(line);
      onValueChange(line);
      onPlaceSelect(place);
      setOpen(false);
    } finally {
      setResolving(false);
    }
  }

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen} modal>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className={cn("relative", className)}>
          <Input
            id={id}
            value={query}
            disabled={disabled || resolving}
            required={required}
            aria-invalid={ariaInvalid}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            placeholder={placeholder}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              onValueChange(next);
              setOpen(true);
            }}
          />
          {(isFetching || resolving) && (
            <Loader2
              className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        container={portalContainer}
        className="z-60 w-(--radix-popover-trigger-width) p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onWheel={(event) => event.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <CommandList id={listId} className="overscroll-contain">
            <CommandEmpty>
              {debounced.length < 2 || isFetching ? minCharsLabel : emptyLabel}
            </CommandEmpty>
            <CommandGroup>
              {suggestions.map((item) => (
                <CommandItem
                  key={item.ref_id}
                  value={item.ref_id}
                  onSelect={() => void pick(item)}
                  className="group items-start gap-2"
                >
                  <MapPin
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground group-data-[selected=true]:text-primary-foreground/80"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {item.name || item.display}
                    </span>
                    {item.address ? (
                      <span className="block truncate text-xs text-muted-foreground group-data-[selected=true]:text-primary-foreground/80">
                        {item.address}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

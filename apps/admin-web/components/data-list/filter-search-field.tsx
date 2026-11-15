"use client";

import { InputGroup, InputGroupAddon, InputGroupInput, cn } from "@bokdy/ui";
import { Search } from "lucide-react";

import { softFilterControl } from "./index";

export function FilterSearchField({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <InputGroup className={cn("h-8 min-w-[12rem] flex-1", softFilterControl, className)}>
      <InputGroupAddon align="inline-start" className="text-foreground/70">
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder ?? label}
        autoComplete="off"
        className="placeholder:text-foreground/70"
      />
    </InputGroup>
  );
}

"use client";

import { Input } from "@bokdy/ui";
import { forwardRef, useState } from "react";

function formatVnd(amount: number) {
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount);
}

function digitsOf(value: string) {
  return value.replace(/\D/g, "");
}

export const CurrencyAmountInput = forwardRef<
  HTMLInputElement,
  {
    id?: string;
    value: number;
    onChange: (value: number) => void;
    onBlur?: () => void;
    "aria-invalid"?: boolean;
  }
>(function CurrencyAmountInput({ id, value, onChange, onBlur, "aria-invalid": ariaInvalid }, ref) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <Input
      id={id}
      ref={ref}
      inputMode="numeric"
      aria-invalid={ariaInvalid || undefined}
      value={focused ? draft : formatVnd(value)}
      onFocus={() => {
        setDraft(Number.isFinite(value) ? String(value) : "");
        setFocused(true);
      }}
      onChange={(event) => {
        const digits = digitsOf(event.target.value);
        setDraft(digits);
        onChange(digits === "" ? Number.NaN : Number(digits));
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
    />
  );
});

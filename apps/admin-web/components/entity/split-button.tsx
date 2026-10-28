"use client";

import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@bokdy/ui";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { softDirectoryPrimaryBtn } from "@/components/data-list";

export type EntitySplitButtonItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

type EntitySplitButtonProps = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Extra classes on both halves (defaults include Soft primary CTA). */
  className?: string;
  /** Accessible label for the chevron menu trigger. */
  menuLabel: string;
  items?: EntitySplitButtonItem[];
};

export function EntitySplitButton({
  label,
  icon,
  onClick,
  disabled,
  className,
  menuLabel,
  items = [],
}: EntitySplitButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMenu = items.length > 0;
  const tone = cn(softDirectoryPrimaryBtn, className);

  return (
    <ButtonGroup aria-label={label} className="shrink-0">
      <Button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          tone,
          "whitespace-nowrap",
          hasMenu && "rounded-r-none shadow-none",
        )}
      >
        {icon}
        {label}
      </Button>

      {hasMenu ? (
        <>
          <ButtonGroupSeparator className="bg-white/30 dark:bg-white/20" />
          <DropdownMenu
            modal={false}
            open={menuOpen}
            onOpenChange={(next) => {
              if (next) setMenuOpen(true);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                disabled={disabled}
                aria-label={menuLabel}
                className={cn(tone, "w-11 shrink-0 rounded-l-none px-0")}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => setMenuOpen((current) => !current)}
              >
                <ChevronDown className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-auto min-w-44"
              onPointerDownOutside={(event) => event.preventDefault()}
              onFocusOutside={(event) => event.preventDefault()}
              onInteractOutside={(event) => event.preventDefault()}
            >
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  disabled={item.disabled}
                  variant={item.destructive ? "destructive" : "default"}
                  className="whitespace-nowrap"
                  onSelect={(event) => {
                    event.preventDefault();
                    if (item.disabled) return;
                    item.onSelect();
                    setMenuOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : null}
    </ButtonGroup>
  );
}

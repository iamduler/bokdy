"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

type SectionAddButtonProps = {
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Icon-only add action that sits on a section header row. */
export function SectionAddButton({ label, href, onClick, disabled, icon }: SectionAddButtonProps) {
  const glyph = icon ?? <Plus className="size-4" aria-hidden />;
  const button = href ? (
    <Button asChild size="icon-sm" aria-label={label}>
      <Link href={href}>{glyph}</Link>
    </Button>
  ) : (
    <Button type="button" size="icon-sm" aria-label={label} onClick={onClick} disabled={disabled}>
      {glyph}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

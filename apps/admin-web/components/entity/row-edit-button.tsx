"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Pencil } from "lucide-react";

import { Link } from "@/i18n/navigation";

type RowEditButtonProps = {
  label: string;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Outline pencil used by directory rows and nested collection rows. */
export function RowEditButton({ label, href, onClick }: RowEditButtonProps) {
  const button = href ? (
    <Button asChild variant="outline" size="icon-sm" aria-label={label}>
      <Link href={href}>
        <Pencil className="size-4" />
      </Link>
    </Button>
  ) : (
    <Button type="button" variant="outline" size="icon-sm" aria-label={label} onClick={onClick}>
      <Pencil className="size-4" />
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

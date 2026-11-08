"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Info } from "lucide-react";

/** Section explanation shown from an info icon on hover or focus. */
export function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 cursor-help rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={text}
        >
          <Info className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-normal text-left">{text}</TooltipContent>
    </Tooltip>
  );
}

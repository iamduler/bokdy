"use client";

import * as React from "react";
import twemoji from "@twemoji/api";

import { cn } from "../lib/utils";

/**
 * Renders emoji via Twemoji SVG (consistent on Windows, where flag glyphs often fail).
 */
export function Emoji({
  emoji,
  className,
  size = 16,
}: {
  emoji: string;
  className?: string;
  size?: number;
}) {
  const html = React.useMemo(
    () =>
      twemoji.parse(emoji, {
        folder: "svg",
        ext: ".svg",
        attributes: () => ({
          width: String(size),
          height: String(size),
          draggable: "false",
          alt: "",
        }),
      }),
    [emoji, size],
  );

  return (
    <span
      className={cn(
        "inline-flex items-center leading-none [&_img]:block [&_img]:h-[1em] [&_img]:w-[1em]",
        className,
      )}
      style={{ fontSize: size }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

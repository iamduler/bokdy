"use client";

import { resolveSportIcon } from "./sport-icons";

export type SportIconProps = {
  /** FA icon name from `catalog.sports.icon`, or sport `code`. */
  icon?: string | null;
  code?: string | null;
  className?: string;
  title?: string;
};

export function SportIcon({ icon, code, className, title }: SportIconProps) {
  const glyph = resolveSportIcon(icon) ?? resolveSportIcon(code);
  if (!glyph) {
    const letter = (code || icon || "?").trim().slice(0, 1).toUpperCase() || "?";
    return (
      <span
        className={className}
        title={title}
        aria-hidden={title ? undefined : true}
        aria-label={title}
      >
        {letter}
      </span>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={glyph.viewBox}
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d={glyph.path} />
    </svg>
  );
}

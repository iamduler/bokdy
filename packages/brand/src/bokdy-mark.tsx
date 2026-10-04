import type { ImgHTMLAttributes } from "react";

export type BokdyMarkProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  /** Accessible name — typically `common.appName` / auth brand. */
  alt: string;
  /** Public path after brand:sync-public. */
  src?: string;
};

/**
 * Bokdy logo mark for brand chrome (auth masthead, sidebar, etc.).
 * Serves `/favicon.svg` from each app's `public/` (synced from this package).
 */
export function BokdyMark({
  alt,
  src = "/favicon.svg",
  className,
  width = 120,
  height = 32,
  ...props
}: BokdyMarkProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      decoding="async"
      className={className}
      {...props}
    />
  );
}

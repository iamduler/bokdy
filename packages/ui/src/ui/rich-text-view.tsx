import * as React from "react";

import { cn } from "../lib/utils";

/** Typography for rich text HTML (no typography plugin in the stack). */
export const richTextProseClass =
  "text-sm leading-relaxed text-foreground wrap-break-word " +
  "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold " +
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold " +
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold " +
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-0.5 [&_li>p]:my-0 " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground " +
  "[&_a]:text-sky-700 [&_a]:underline dark:[&_a]:text-sky-300 " +
  "[&_hr]:my-4 [&_hr]:border-border " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] " +
  "[&_strong]:font-semibold";

export type RichTextViewProps = Omit<
  React.ComponentProps<"div">,
  "children" | "dangerouslySetInnerHTML"
> & {
  /**
   * Trusted HTML only. The API sanitizes `description_*` on write, so this
   * component does not sanitize again; never pass user-supplied raw HTML.
   */
  html: string | null | undefined;
};

export function RichTextView({ html, className, ...props }: RichTextViewProps) {
  if (!html?.trim()) return null;
  return (
    <div
      data-slot="rich-text-view"
      className={cn(richTextProseClass, className)}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}

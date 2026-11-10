import * as React from "react";

import { cn } from "../lib/utils";

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-md bg-muted px-1.5 font-sans text-[10px] font-medium text-muted-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}

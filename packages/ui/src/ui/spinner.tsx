import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

export function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>) {
  return <Loader2 role="status" aria-hidden data-slot="spinner" className={cn("size-4 animate-spin", className)} {...props} />;
}

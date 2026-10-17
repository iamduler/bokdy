import type { ReactNode } from "react";

export function EntitySectionHead({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{children}</div>
  );
}

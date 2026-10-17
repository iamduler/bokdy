import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

export const entityFormSectionClass =
  "space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm [&_input]:bg-white dark:[&_input]:bg-background mb-2 md:mb-4";

export const entityFormFieldsClass = "grid grid-cols-1 gap-4 sm:grid-cols-2";

export function EntityFormSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(entityFormSectionClass, className)}>
      {title ? <h2 className="text-sm font-medium">{title}</h2> : null}
      {children}
    </section>
  );
}

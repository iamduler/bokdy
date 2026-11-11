import { cn } from "@bokdy/ui";
import type { ComponentProps, ReactNode } from "react";

import { Link } from "@/i18n/navigation";

type EntityRelationLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
  className?: string;
};

/** Profile-field link to another Bokdy entity. Color is `--relation-link`. */
export function EntityRelationLink({
  href,
  children,
  className,
}: EntityRelationLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-relation-link underline-offset-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}

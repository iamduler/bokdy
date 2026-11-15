"use client";

import type { ReactNode } from "react";

import { EntityAvatar } from "@/components/entity/avatar";
import { Link } from "@/i18n/navigation";

export function DirectoryIdentityCell({
  href,
  name,
  subtitle,
  avatar,
}: {
  href: string;
  name: string;
  subtitle?: ReactNode;
  /** When set, shows the entity avatar before the name. */
  avatar?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {avatar ? <EntityAvatar name={name} size="sm" /> : null}
      <div className="min-w-0">
        <Link
          href={href}
          className="block truncate font-medium text-foreground underline-offset-4"
        >
          {name}
        </Link>
        {subtitle ? (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

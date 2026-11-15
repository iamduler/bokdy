"use client";

import type { ReactNode } from "react";

import { EntityAvatar } from "@/components/entity/avatar";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { Link } from "@/i18n/navigation";

export function DirectoryIdentityCell({
  href,
  name,
  subtitle,
  avatar,
  src,
  relation,
}: {
  href: string;
  name: string;
  subtitle?: ReactNode;
  /** When set, shows the entity avatar before the name. */
  avatar?: boolean;
  /** Logo URL. Missing or failed images fall back to initials. */
  src?: string | null;
  /** Relation columns link with EntityRelationLink. */
  relation?: boolean;
}) {
  const labelClass = "block truncate font-medium";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {avatar ? <EntityAvatar name={name} size="sm" src={src || undefined} /> : null}
      <div className="min-w-0">
        {relation ? (
          <EntityRelationLink href={href} className={labelClass}>
            {name}
          </EntityRelationLink>
        ) : (
          <Link href={href} className={`${labelClass} text-foreground underline-offset-4`}>
            {name}
          </Link>
        )}
        {subtitle ? (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

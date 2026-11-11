"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EntityDetailScreenHeader } from "@/components/entity/detail-screen-header";

import { useOrganizationDetail } from "./organization-detail-context";

type OrganizationDetailScreenHeaderProps = {
  title: string;
  subtitle?: string;
  hint?: string;
  actions?: ReactNode;
  className?: string;
};

export function OrganizationDetailScreenHeader({
  title,
  subtitle,
  hint,
  actions,
  className,
}: OrganizationDetailScreenHeaderProps) {
  const tShell = useTranslations("shell");
  const { orgId } = useOrganizationDetail();

  return (
    <EntityDetailScreenHeader
      backHref={`/organizations/${orgId}`}
      backLabel={tShell("menuBack")}
      title={title}
      subtitle={subtitle}
      hint={hint}
      actions={actions}
      className={className}
    />
  );
}

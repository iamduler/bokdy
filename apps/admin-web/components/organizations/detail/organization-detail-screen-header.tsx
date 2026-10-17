"use client";

import type { ReactNode } from "react";

import { EntityDetailScreenHeader } from "@/components/entity/detail-screen-header";

import { useOrganizationDetail } from "./organization-detail-context";

type OrganizationDetailScreenHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function OrganizationDetailScreenHeader({
  title,
  subtitle,
  actions,
  className,
}: OrganizationDetailScreenHeaderProps) {
  const { orgId } = useOrganizationDetail();

  return (
    <EntityDetailScreenHeader
      backHref={`/organizations/${orgId}`}
      backLabel={title}
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
    />
  );
}

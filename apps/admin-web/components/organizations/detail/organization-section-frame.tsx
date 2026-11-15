"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EntityDetailSectionFrame } from "@/components/entity/detail-section-frame";

import { useOrganizationDetail } from "./organization-detail-context";

type OrganizationSectionFrameProps = {
  title: string;
  subtitle?: string;
  hint?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

/** Organization detail section. Back link comes from the org route. */
export function OrganizationSectionFrame(props: OrganizationSectionFrameProps) {
  const tShell = useTranslations("shell");
  const { orgId } = useOrganizationDetail();

  return (
    <EntityDetailSectionFrame
      backHref={`/organizations/${orgId}`}
      backLabel={tShell("menuBack")}
      {...props}
    />
  );
}

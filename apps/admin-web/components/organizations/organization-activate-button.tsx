"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { StatusActionButton } from "@/components/entity/status-action-button";
import { useActivateOrganization } from "@/hooks/use-activate-organization";
import type { OrgStatus } from "@/lib/api/admin";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

type OrganizationActivateButtonProps = {
  orgId: string;
  status: OrgStatus;
};

export function OrganizationActivateButton({ orgId, status }: OrganizationActivateButtonProps) {
  const t = useTranslations("organization");
  const te = useTranslations("errors");
  const activate = useActivateOrganization();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (status !== "inactive") {
    return null;
  }

  return (
    <StatusActionButton
      label={t("activate")}
      pending={activate.isPending}
      error={error}
      success={success ? t("activateSuccess") : null}
      onClick={async () => {
        setError(null);
        setSuccess(false);
        try {
          await activate.mutateAsync(orgId);
          setSuccess(true);
        } catch (err) {
          const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
          setError(apiErr.status === 409 ? t("activateConflict") : te(errorMessageKey(apiErr)));
        }
      }}
    />
  );
}

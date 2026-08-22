"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

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

  async function onActivate() {
    setError(null);
    setSuccess(false);
    try {
      await activate.mutateAsync(orgId);
      setSuccess(true);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      if (apiErr.status === 409) {
        setError(t("activateConflict"));
      } else {
        setError(te(errorMessageKey(apiErr)));
      }
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={onActivate} disabled={activate.isPending}>
        {t("activate")}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("activateSuccess")}</p>
      ) : null}
    </div>
  );
}

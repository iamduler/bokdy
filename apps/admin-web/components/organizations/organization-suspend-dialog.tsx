"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ReasonActionDialog } from "@/components/entity/reason-action-dialog";
import { useSuspendOrganization } from "@/hooks/use-suspend-organization";
import type { OrgStatus } from "@/lib/api/admin";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

type OrganizationSuspendDialogProps = {
  orgId: string;
  status: OrgStatus;
};

export function OrganizationSuspendDialog({ orgId, status }: OrganizationSuspendDialogProps) {
  const t = useTranslations("organization");
  const te = useTranslations("errors");
  const suspend = useSuspendOrganization();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (status !== "active") {
    return success ? (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("suspendSuccess")}</p>
    ) : null;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => {
          setSuccess(false);
          setError(null);
          setOpen(true);
        }}
      >
        {t("suspend")}
      </Button>
      {success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("suspendSuccess")}</p>
      ) : null}
      <ReasonActionDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("suspendTitle")}
        hint={t("suspendHint")}
        reasonLabel={t("suspendReason")}
        reasonId="suspend-reason"
        cancelLabel={t("cancel")}
        submitLabel={t("submitSuspend")}
        closeLabel={t("cancel")}
        pending={suspend.isPending}
        error={error}
        requiredMessage={te("REQUIRED")}
        destructive
        onSubmit={async (reason) => {
          setError(null);
          try {
            await suspend.mutateAsync({ id: orgId, reason });
            setSuccess(true);
            setOpen(false);
          } catch (err) {
            const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
            setError(apiErr.status === 409 ? t("suspendConflict") : te(errorMessageKey(apiErr)));
          }
        }}
      />
    </div>
  );
}

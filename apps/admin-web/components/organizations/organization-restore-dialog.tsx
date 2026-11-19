"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmActionDialog } from "@/components/entity/confirm-action-dialog";
import { useRestoreOrganization } from "@/hooks/use-restore-organization";
import type { OrgStatus } from "@/lib/api/admin";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

type OrganizationRestoreDialogProps = {
  orgId: string;
  status: OrgStatus;
};

export function OrganizationRestoreDialog({ orgId, status }: OrganizationRestoreDialogProps) {
  const t = useTranslations("organization");
  const te = useTranslations("errors");
  const restore = useRestoreOrganization();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (status !== "suspended") {
    return success ? (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("restoreSuccess")}</p>
    ) : null;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        onClick={() => {
          setSuccess(false);
          setError(null);
          setOpen(true);
        }}
      >
        {t("restore")}
      </Button>
      {success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("restoreSuccess")}</p>
      ) : null}
      <ConfirmActionDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("restoreTitle")}
        description={t("restoreHint")}
        cancelLabel={t("cancel")}
        confirmLabel={t("submitRestore")}
        pending={restore.isPending}
        error={error}
        onConfirm={async () => {
          setError(null);
          try {
            await restore.mutateAsync(orgId);
            setSuccess(true);
            setOpen(false);
          } catch (err) {
            const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
            setError(apiErr.status === 409 ? t("restoreConflict") : te(errorMessageKey(apiErr)));
          }
        }}
      />
    </div>
  );
}

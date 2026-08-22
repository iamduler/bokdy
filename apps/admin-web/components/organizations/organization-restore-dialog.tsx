"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRestoreOrganization } from "@/hooks/use-restore-organization";
import type { OrgStatus } from "@/lib/api/admin";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

import { OrganizationActionDialog } from "./organization-action-dialog";

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

  function close() {
    setOpen(false);
    setError(null);
  }

  async function onConfirm() {
    setError(null);
    try {
      await restore.mutateAsync(orgId);
      setSuccess(true);
      close();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      if (apiErr.status === 409) {
        setError(t("restoreConflict"));
      } else {
        setError(te(errorMessageKey(apiErr)));
      }
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={() => {
          setSuccess(false);
          setOpen(true);
        }}
      >
        {t("restore")}
      </Button>
      {success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("restoreSuccess")}</p>
      ) : null}

      <OrganizationActionDialog open={open} title={t("restoreTitle")} closeLabel={t("cancel")} onClose={close}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("restoreHint")}</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={restore.isPending}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={onConfirm} disabled={restore.isPending}>
              {t("submitRestore")}
            </Button>
          </div>
        </div>
      </OrganizationActionDialog>
    </div>
  );
}

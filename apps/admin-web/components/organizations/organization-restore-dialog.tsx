"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

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

      <AlertDialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("restoreTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("restoreHint")}</AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restore.isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={restore.isPending} onClick={(event) => { event.preventDefault(); onConfirm(); }}>
              {t("submitRestore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

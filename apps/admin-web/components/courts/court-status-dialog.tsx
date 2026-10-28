"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EntityActionDialog } from "@/components/entity/action-dialog";
import {
  useArchiveCourt,
  useCloseCourt,
  useCompleteCourtMaintenance,
  useOpenCourt,
  useStartCourtMaintenance,
} from "@/hooks/use-courts";
import type { Court } from "@/lib/api/courts";
import { ApiError } from "@/lib/api/errors";

type ConfirmKind = "archive" | "maintenance" | null;

type CourtStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  court: Court;
};

export function CourtStatusDialog({
  open,
  onOpenChange,
  organizationId,
  court,
}: CourtStatusDialogProps) {
  const t = useTranslations("organization.court");
  const courtId = court.id;
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCourt = useOpenCourt(organizationId, courtId);
  const close = useCloseCourt(organizationId, courtId);
  const archive = useArchiveCourt(organizationId, courtId);
  const startMaint = useStartCourtMaintenance(organizationId, courtId);
  const completeMaint = useCompleteCourtMaintenance(organizationId, courtId);

  const pending =
    openCourt.isPending ||
    close.isPending ||
    archive.isPending ||
    startMaint.isPending ||
    completeMaint.isPending;

  async function runAction(fn: () => Promise<unknown>) {
    setActionError(null);
    try {
      await fn();
      setConfirm(null);
      onOpenChange(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : t("actionError"));
    }
  }

  function handleClose() {
    setConfirm(null);
    setActionError(null);
    onOpenChange(false);
  }

  return (
    <>
      <EntityActionDialog
        open={open && confirm === null}
        title={t("updateStatus")}
        closeLabel={t("cancel")}
        onClose={handleClose}
      >
        <div className="flex flex-wrap gap-2">
          {court.status === "inactive" ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => void runAction(() => openCourt.mutateAsync())}
            >
              {t("actionOpen")}
            </Button>
          ) : null}
          {court.status === "active" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => void runAction(() => close.mutateAsync())}
            >
              {t("actionClose")}
            </Button>
          ) : null}
          {court.status === "active" || court.status === "inactive" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirm("maintenance")}
            >
              {t("actionMaintenance")}
            </Button>
          ) : null}
          {court.status === "maintenance" ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => void runAction(() => completeMaint.mutateAsync())}
            >
              {t("actionCompleteMaintenance")}
            </Button>
          ) : null}
          {court.status === "inactive" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={pending}
              onClick={() => setConfirm("archive")}
            >
              {t("actionArchive")}
            </Button>
          ) : null}
          {court.status === "archived" ? (
            <p className="text-sm text-muted-foreground">{t("status.archived")}</p>
          ) : null}
        </div>
        {actionError ? (
          <p className="mt-3 text-sm text-destructive">{actionError}</p>
        ) : null}
      </EntityActionDialog>

      <EntityActionDialog
        open={confirm !== null}
        title={confirm === "archive" ? t("archiveTitle") : t("maintenanceTitle")}
        closeLabel={t("cancel")}
        onClose={() => setConfirm(null)}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          {confirm === "archive" ? t("archiveHint") : t("maintenanceHint")}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={pending}
            className={
              confirm === "archive" ? "bg-destructive text-destructive-foreground" : undefined
            }
            onClick={() => {
              if (confirm === "archive") {
                void runAction(() => archive.mutateAsync());
              } else if (confirm === "maintenance") {
                void runAction(() => startMaint.mutateAsync({}));
              }
            }}
          >
            {confirm === "archive" ? t("actionArchive") : t("actionMaintenance")}
          </Button>
        </div>
      </EntityActionDialog>
    </>
  );
}

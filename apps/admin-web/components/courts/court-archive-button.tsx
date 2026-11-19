"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button, toast, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmActionDialog } from "@/components/entity/confirm-action-dialog";
import { adminCourtKeys } from "@/hooks/use-admin-courts";
import { useArchiveCourt } from "@/hooks/use-courts";
import type { CourtStatus } from "@/lib/api/courts";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

type CourtArchiveButtonProps = {
  organizationId: string;
  courtId: string;
  name: string;
  status: CourtStatus | string;
};

export function CourtArchiveButton({
  organizationId,
  courtId,
  name,
  status,
}: CourtArchiveButtonProps) {
  const t = useTranslations("organization.court");
  const te = useTranslations("errors");
  const queryClient = useQueryClient();
  const archive = useArchiveCourt(organizationId, courtId);
  const [open, setOpen] = useState(false);

  if (status !== "inactive") return null;

  async function onConfirm() {
    try {
      await archive.mutateAsync();
      void queryClient.invalidateQueries({ queryKey: adminCourtKeys.all });
      setOpen(false);
      toast.success(t("deleted"));
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label={t("delete")}
            onClick={() => setOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("delete")}</TooltipContent>
      </Tooltip>
      <ConfirmActionDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("deleteTitle")}
        description={t("deleteConfirm", { name })}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        pending={archive.isPending}
        destructive
        onConfirm={() => {
          void onConfirm();
        }}
      />
    </>
  );
}

"use client";

import { Button, toast, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmActionDialog } from "@/components/entity/confirm-action-dialog";
import { useArchiveOrganization } from "@/hooks/use-archive-organization";
import type { OrgStatus } from "@/lib/api/admin";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

type OrganizationArchiveButtonProps = {
  orgId: string;
  name: string;
  status: OrgStatus;
  appearance?: "icon" | "text";
};

export function OrganizationArchiveButton({
  orgId,
  name,
  status,
  appearance = "icon",
}: OrganizationArchiveButtonProps) {
  const t = useTranslations("organization");
  const te = useTranslations("errors");
  const archive = useArchiveOrganization();
  const [open, setOpen] = useState(false);

  if (status === "archived") {
    return null;
  }

  async function onConfirm() {
    try {
      await archive.mutateAsync(orgId);
      setOpen(false);
      toast.success(t("deleted"));
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    }
  }

  return (
    <>
      {appearance === "text" ? (
        <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
          {t("delete")}
        </Button>
      ) : (
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
      )}
      <ConfirmActionDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("deleteTitle")}
        description={t("deleteConfirm", { name })}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        pending={archive.isPending}
        destructive
        onConfirm={() => void onConfirm()}
      />
    </>
  );
}

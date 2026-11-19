"use client";

import { Button, toast, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmActionDialog } from "@/components/entity/confirm-action-dialog";
import { adminBranchKeys } from "@/hooks/use-admin-branches";
import { adminOrganizationKeys } from "@/hooks/use-admin-organizations";
import { branchKeys } from "@/hooks/use-branches";
import { archiveBranch, type BranchStatus } from "@/lib/api/branches";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type BranchArchiveButtonProps = {
  organizationId: string;
  branchId: string;
  name: string;
  status: BranchStatus | string;
  appearance?: "icon" | "text";
};

export function BranchArchiveButton({
  organizationId,
  branchId,
  name,
  status,
  appearance = "icon",
}: BranchArchiveButtonProps) {
  const t = useTranslations("organization.branch");
  const te = useTranslations("errors");
  const queryClient = useQueryClient();
  const archive = useMutation({
    mutationFn: () => archiveBranch(organizationId, branchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: branchKeys.list(organizationId) });
      void queryClient.invalidateQueries({ queryKey: branchKeys.detail(branchId) });
      void queryClient.invalidateQueries({ queryKey: adminBranchKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.detail(organizationId) });
    },
  });
  const [open, setOpen] = useState(false);

  if (status === "archived") {
    return null;
  }

  async function onConfirm() {
    try {
      await archive.mutateAsync();
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

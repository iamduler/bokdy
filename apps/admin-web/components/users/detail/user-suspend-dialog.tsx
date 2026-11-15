"use client";

import { useTranslations } from "next-intl";

import { ReasonActionDialog } from "@/components/entity/reason-action-dialog";
import { useSuspendUser } from "@/hooks/use-admin-users";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

type UserSuspendDialogProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
};

export function UserSuspendDialog({ open, onClose, userId }: UserSuspendDialogProps) {
  const t = useTranslations("users.suspend");
  const te = useTranslations("errors");
  const suspend = useSuspendUser();

  const error = suspend.isError
    ? te(errorMessageKey(suspend.error instanceof ApiError ? suspend.error : new ApiError("INTERNAL", "", 500)))
    : null;

  return (
    <ReasonActionDialog
      open={open}
      onClose={onClose}
      title={t("title")}
      hint={t("hint")}
      reasonLabel={t("reason")}
      reasonId="user-suspend-reason"
      cancelLabel={t("cancel")}
      submitLabel={t("submit")}
      closeLabel={t("cancel")}
      pending={suspend.isPending}
      error={error}
      requiredMessage={te("REQUIRED")}
      destructive
      onSubmit={async (reason) => {
        try {
          await suspend.mutateAsync({ id: userId, reason });
          onClose();
        } catch {
          // Reason stays in the dialog; the mutation error renders below the field.
        }
      }}
    />
  );
}

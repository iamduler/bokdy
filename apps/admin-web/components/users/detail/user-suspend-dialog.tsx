"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Label } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { OrganizationActionDialog } from "@/components/organizations/organization-action-dialog";
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

  const schema = useMemo(
    () => z.object({ reason: z.string().trim().min(1, te("REQUIRED")) }),
    [te],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ reason: string }>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  function close() {
    onClose();
    reset({ reason: "" });
  }

  async function onSubmit(values: { reason: string }) {
    try {
      await suspend.mutateAsync({ id: userId, reason: values.reason });
      close();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      // error surfaced via suspend.isError — keep dialog open
      void apiErr;
    }
  }

  return (
    <OrganizationActionDialog open={open} title={t("title")} closeLabel={t("cancel")} onClose={close}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
        <div className="space-y-1.5">
          <Label htmlFor="user-suspend-reason">{t("reason")}</Label>
          <textarea
            id="user-suspend-reason"
            rows={4}
            className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("reason")}
          />
          {errors.reason?.message ? (
            <p className="text-sm text-destructive">{errors.reason.message}</p>
          ) : null}
        </div>
        {suspend.isError ? (
          <p className="text-sm text-destructive">
            {te(errorMessageKey(suspend.error instanceof ApiError ? suspend.error : new ApiError("INTERNAL", "", 500)))}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={suspend.isPending}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={suspend.isPending}
          >
            {t("submit")}
          </Button>
        </div>
      </form>
    </OrganizationActionDialog>
  );
}

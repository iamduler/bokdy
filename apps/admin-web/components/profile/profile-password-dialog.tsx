"use client";

import { Button, Field, FieldError, FieldLabel, Input, toast } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { softDirectoryPrimaryBtn, softDirectorySecondaryBtn } from "@/components/data-list";
import { EntityActionDialog } from "@/components/entity/action-dialog";
import { changePassword } from "@/lib/api/identity";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/validation/profile-security";

type ProfilePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfilePasswordDialog({ open, onClose }: ProfilePasswordDialogProps) {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(
      useMemo(
        () =>
          changePasswordSchema({
            required: te("REQUIRED"),
            mismatch: t("passwordMismatch"),
          }),
        [t, te],
      ),
    ),
    defaultValues: { password: "", password_confirm: "" },
  });

  const save = useMutation({
    mutationFn: (values: ChangePasswordValues) => changePassword({ password: values.password }),
    onSuccess: () => {
      form.reset();
      toast.success(t("passwordSaved"));
      onClose();
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    },
  });

  return (
    <EntityActionDialog open={open} title={t("changePassword")} closeLabel={t("cancel")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        noValidate
      >
        <Field className="gap-1.5">
          <FieldLabel htmlFor="profile-new-password" required>
            {t("newPassword")}
          </FieldLabel>
          <Input
            id="profile-new-password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="profile-confirm-password" required>
            {t("confirmPassword")}
          </FieldLabel>
          <Input
            id="profile-confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register("password_confirm")}
          />
          <FieldError>{form.formState.errors.password_confirm?.message}</FieldError>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className={softDirectorySecondaryBtn} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" className={softDirectoryPrimaryBtn} disabled={save.isPending}>
            {t("changePassword")}
          </Button>
        </div>
      </form>
    </EntityActionDialog>
  );
}

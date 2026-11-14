"use client";

import { Button, Field, FieldError, FieldLabel, Input, toast } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { softDirectoryPrimaryBtn, softDirectorySecondaryBtn } from "@/components/data-list";
import { EntityActionDialog } from "@/components/entity/action-dialog";
import { meKeys } from "@/hooks/use-me";
import { changeEmail } from "@/lib/api/identity";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { changeEmailSchema, type ChangeEmailValues } from "@/lib/validation/profile-security";

type ProfileEmailDialogProps = {
  open: boolean;
  onClose: () => void;
  currentEmail?: string;
};

export function ProfileEmailDialog({ open, onClose, currentEmail }: ProfileEmailDialogProps) {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const queryClient = useQueryClient();
  const form = useForm<ChangeEmailValues>({
    resolver: zodResolver(
      useMemo(
        () => changeEmailSchema({ required: te("REQUIRED"), invalid: te("INVALID") }),
        [te],
      ),
    ),
    defaultValues: { current_password: "", email: currentEmail ?? "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ current_password: "", email: currentEmail ?? "" });
    }
  }, [open, currentEmail, form]);

  const save = useMutation({
    mutationFn: changeEmail,
    onSuccess: () => {
      toast.success(t("emailChangeSent"));
      void queryClient.invalidateQueries({ queryKey: meKeys.all });
      onClose();
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    },
  });

  return (
    <EntityActionDialog open={open} title={t("changeEmail")} closeLabel={t("cancel")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        noValidate
      >
        <p className="text-sm text-muted-foreground">{t("emailChangeHint")}</p>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="profile-email" required>
            {t("email")}
          </FieldLabel>
          <Input id="profile-email" type="email" autoComplete="email" {...form.register("email")} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="profile-email-password" required>
            {t("currentPassword")}
          </FieldLabel>
          <Input
            id="profile-email-password"
            type="password"
            autoComplete="current-password"
            {...form.register("current_password")}
          />
          <FieldError>{form.formState.errors.current_password?.message}</FieldError>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className={softDirectorySecondaryBtn} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" className={softDirectoryPrimaryBtn} disabled={save.isPending}>
            {t("changeEmail")}
          </Button>
        </div>
      </form>
    </EntityActionDialog>
  );
}

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
import { changePhone } from "@/lib/api/identity";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { changePhoneSchema, type ChangePhoneValues } from "@/lib/validation/profile-security";

type ProfilePhoneDialogProps = {
  open: boolean;
  onClose: () => void;
  currentPhone?: string;
};

export function ProfilePhoneDialog({ open, onClose, currentPhone }: ProfilePhoneDialogProps) {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const queryClient = useQueryClient();
  const form = useForm<ChangePhoneValues>({
    resolver: zodResolver(useMemo(() => changePhoneSchema({ required: te("REQUIRED") }), [te])),
    defaultValues: { current_password: "", phone: currentPhone ?? "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ current_password: "", phone: currentPhone ?? "" });
    }
  }, [open, currentPhone, form]);

  const save = useMutation({
    mutationFn: changePhone,
    onSuccess: () => {
      toast.success(t("phoneSaved"));
      void queryClient.invalidateQueries({ queryKey: meKeys.all });
      onClose();
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    },
  });

  return (
    <EntityActionDialog open={open} title={t("changePhone")} closeLabel={t("cancel")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        noValidate
      >
        <Field className="gap-1.5">
          <FieldLabel htmlFor="profile-phone" required>
            {t("phone")}
          </FieldLabel>
          <Input id="profile-phone" type="tel" autoComplete="tel" {...form.register("phone")} />
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="profile-phone-password" required>
            {t("currentPassword")}
          </FieldLabel>
          <Input
            id="profile-phone-password"
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
            {t("changePhone")}
          </Button>
        </div>
      </form>
    </EntityActionDialog>
  );
}

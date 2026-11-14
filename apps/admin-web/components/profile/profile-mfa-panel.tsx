"use client";

import { Button, Field, FieldError, FieldLabel, Input, toast } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { softDirectoryPrimaryBtn, softFieldSecondaryBtn } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { apiGo } from "@/lib/api/client";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { mfaConfirmSchema, type MfaConfirmValues } from "@/lib/validation/profile-security";

export function ProfileMfaPanel() {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const mfaForm = useForm<MfaConfirmValues>({
    resolver: zodResolver(useMemo(() => mfaConfirmSchema({ required: te("REQUIRED") }), [te])),
    defaultValues: { code: "" },
  });

  const enroll = useMutation({
    mutationFn: () => apiGo<{ secret: string }>("identity/mfa/enroll", { method: "POST" }),
    onSuccess: () => mfaForm.reset({ code: "" }),
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    },
  });

  const confirm = useMutation({
    mutationFn: (values: MfaConfirmValues) =>
      apiGo<void>("identity/mfa/confirm", {
        method: "POST",
        body: JSON.stringify({ code: values.code }),
      }),
    onSuccess: () => {
      enroll.reset();
      mfaForm.reset({ code: "" });
      toast.success(t("mfaSaved"));
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    },
  });

  const secret = enroll.data?.secret ?? "";

  return (
    <EntityDetailPanel
      title={t("sections.mfa")}
      hint={t("hints.mfa")}
      icon={<ShieldCheck className="size-4" aria-hidden />}
      tone="sky"
    >
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={softFieldSecondaryBtn}
          onClick={() => enroll.mutate()}
          disabled={enroll.isPending}
        >
          {t("enrollMfa")}
        </Button>
      </div>
      {secret ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={mfaForm.handleSubmit((values) => confirm.mutate(values))}
          noValidate
        >
          <Field className="gap-1.5">
            <FieldLabel htmlFor="mfa-secret">{t("mfaSecret")}</FieldLabel>
            <Input id="mfa-secret" readOnly value={secret} className="tracking-wide" />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="mfa-code" required>
              {t("mfaCode")}
            </FieldLabel>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              {...mfaForm.register("code")}
            />
            <FieldError>{mfaForm.formState.errors.code?.message}</FieldError>
          </Field>
          <div className="flex justify-end">
            <Button type="submit" className={softDirectoryPrimaryBtn} disabled={confirm.isPending}>
              {t("confirmMfa")}
            </Button>
          </div>
        </form>
      ) : null}
    </EntityDetailPanel>
  );
}

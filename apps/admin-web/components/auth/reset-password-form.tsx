"use client";

import { AuthActionButton, AuthAlert, AuthPasswordField } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  AdminAuthHeading,
  austereActionClassName,
  austerePasswordWrapClassName,
} from "@/components/auth/admin-auth-heading";
import { Link } from "@/i18n/navigation";
import { useResetPassword } from "@/hooks/use-auth";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validation/auth";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const searchParams = useSearchParams();
  const resetPassword = useResetPassword();
  const token = searchParams.get("token")?.trim() ?? "";
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const schema = useMemo(
    () =>
      resetPasswordSchema({
        required: te("REQUIRED"),
        passwordPolicy: te("PASSWORD_POLICY"),
        passwordMismatch: t("passwordMismatch"),
      }),
    [t, te],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setError(null);
    try {
      await resetPassword.mutateAsync({
        token,
        new_password: values.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      const apiErr =
        err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      setError(
        apiErr.status === 401
          ? t("resetTokenInvalid")
          : te(errorMessageKey(apiErr)),
      );
    }
  }

  if (!token) {
    return (
      <div className="space-y-8 text-shell-text">
        <AdminAuthHeading
          title={t("resetPasswordTitle")}
          description={t("resetTokenMissing")}
        />
        <div className="space-y-3">
          <Link
            href="/forgot-password"
            className="block text-sm font-medium text-shell-text"
          >
            {t("forgotPasswordLink")}
          </Link>
          <Link
            href="/login"
            className="block text-sm text-shell-text-muted hover:text-shell-text"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-8 text-shell-text">
        <AdminAuthHeading
          title={t("resetPasswordTitle")}
          description={t("resetPasswordSuccess")}
        />
        <Link href="/login" className="text-sm font-medium text-shell-text">
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-shell-text">
      <AdminAuthHeading
        title={t("resetPasswordTitle")}
        description={t("resetPasswordHint")}
      />
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <AuthPasswordField
          label={t("newPassword")}
          hint={t("passwordHint")}
          autoComplete="new-password"
          placeholder={t("newPasswordPlaceholder")}
          error={errors.newPassword?.message}
          className={austerePasswordWrapClassName}
          {...register("newPassword")}
        />
        <AuthPasswordField
          label={t("confirmPassword")}
          autoComplete="new-password"
          placeholder={t("confirmPasswordPlaceholder")}
          error={errors.confirmPassword?.message}
          className={austerePasswordWrapClassName}
          {...register("confirmPassword")}
        />
        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}
        <AuthActionButton
          type="submit"
          disabled={resetPassword.isPending}
          className={austereActionClassName}
        >
          {t("submitResetPassword")}
        </AuthActionButton>
        <p className="text-sm">
          <Link
            href="/login"
            className="text-shell-text-muted hover:text-shell-text"
          >
            {t("backToLogin")}
          </Link>
        </p>
      </form>
    </div>
  );
}

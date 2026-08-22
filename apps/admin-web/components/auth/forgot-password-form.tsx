"use client";

import { AuthActionButton, AuthAlert, AuthField, AuthFormFrame } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { useForgotPassword } from "@/hooks/use-auth";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/auth";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const forgotPassword = useForgotPassword();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const schema = useMemo(
    () => forgotPasswordSchema({ required: te("REQUIRED"), emailInvalid: te("EMAIL_INVALID") }),
    [te],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setError(null);
    try {
      await forgotPassword.mutateAsync(values);
      setSent(true);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      setError(te(errorMessageKey(apiErr)));
    }
  }

  return (
    <AuthFormFrame eyebrow={t("adminEyebrow")} title={t("forgotPasswordTitle")} description={t("forgotPasswordHint")}>
      {sent ? (
        <div className="space-y-4">
          <AuthAlert tone="success">{t("forgotPasswordSent")}</AuthAlert>
          <Link href="/login" className="text-sm font-medium text-shell-text hover:underline">
            {t("backToLogin")}
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <AuthField
            label={t("email")}
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            error={errors.email?.message}
            {...register("email")}
          />
          {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}
          <AuthActionButton type="submit" disabled={forgotPassword.isPending}>
            {t("submitForgotPassword")}
          </AuthActionButton>
          <p className="text-center text-sm">
            <Link href="/login" className="text-shell-text-muted hover:text-shell-text hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </form>
      )}
    </AuthFormFrame>
  );
}

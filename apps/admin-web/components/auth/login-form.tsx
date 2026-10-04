"use client";

import {
  AuthActionButton,
  AuthAlert,
  AuthField,
  AuthPasswordField,
} from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import {
  AdminAuthHeading,
  austereActionClassName,
  austereFieldWrapClassName,
  austerePasswordWrapClassName,
} from "@/components/auth/admin-auth-heading";
import { Link, useRouter } from "@/i18n/navigation";
import { useLogin } from "@/hooks/use-auth";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

export function LoginForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const schema = useMemo(
    () =>
      loginSchema({
        required: te("REQUIRED"),
        emailInvalid: te("EMAIL_INVALID"),
      }),
    [te],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (error) {
      alertRef.current?.focus();
    }
  }, [error]);

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    try {
      await login.mutateAsync(values);
      router.push("/organizations");
      router.refresh();
    } catch (err) {
      const apiErr =
        err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      setError(te(errorMessageKey(apiErr)));
    }
  }

  return (
    <div className="space-y-6 text-shell-text">
      <AdminAuthHeading title={t("loginTitle")} />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("emailPlaceholder")}
          error={errors.email?.message}
          leading={<Mail className="h-4 w-4" />}
          className={austereFieldWrapClassName}
          {...register("email")}
        />
        <AuthPasswordField
          label={t("password")}
          labelExtra={
            <Link
              href="/forgot-password"
              className="cursor-pointer text-xs font-medium text-shell-accent underline-offset-4 transition-colors duration-200 hover:underline"
            >
              {t("forgotPasswordLink")}
            </Link>
          }
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          error={errors.password?.message}
          leading={<Lock className="h-4 w-4" />}
          className={austerePasswordWrapClassName}
          {...register("password")}
        />
        {error ? (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <AuthAlert tone="danger">{error}</AuthAlert>
          </div>
        ) : null}
        <AuthActionButton
          type="submit"
          disabled={login.isPending}
          aria-busy={login.isPending}
          className={austereActionClassName}
        >
          {login.isPending ? t("submitLoginPending") : t("submitLogin")}
        </AuthActionButton>
      </form>
    </div>
  );
}

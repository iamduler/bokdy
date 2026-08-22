"use client";

import {
  AuthActionButton,
  AuthAlert,
  AuthField,
  AuthFormFrame,
  AuthPasswordField,
  Button,
} from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Link, useRouter } from "@/i18n/navigation";
import { useLogin } from "@/hooks/use-auth";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { SEED_ADMIN } from "@/lib/dev/seed-admin";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

const showSeed = process.env.NODE_ENV === "development";

export function LoginForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

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
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

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

  function fillSeed() {
    setValue("email", SEED_ADMIN.email, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("password", SEED_ADMIN.password, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  return (
    <AuthFormFrame
      eyebrow={t("adminEyebrow")}
      title={t("loginTitle")}
      description={t("loginSubtitle")}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <AuthField
          label={t("email")}
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthPasswordField
          label={t("password")}
          labelExtra={
            <Link
              href="/forgot-password"
              className="text-xs text-shell-text-muted hover:text-shell-text"
            >
              {t("forgotPasswordLink")}
            </Link>
          }
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          error={errors.password?.message}
          {...register("password")}
        />
        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}
        <AuthActionButton type="submit" disabled={login.isPending}>
          {t("submitLogin")}
        </AuthActionButton>
      </form>

      {showSeed ? (
        <div className="rounded-xl border border-shell-border bg-shell-card px-4 py-3 text-sm text-shell-text-muted">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]">
            {t("seedTitle")}
          </p>
          <dl className="space-y-1 text-xs tracking-wide text-shell-text">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-shell-text-muted">{t("seedEmail")}:</dt>
              <dd>{SEED_ADMIN.email}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-shell-text-muted">{t("seedPassword")}:</dt>
              <dd>{SEED_ADMIN.password}</dd>
            </div>
          </dl>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={fillSeed}
          >
            {t("seedFill")}
          </Button>
        </div>
      ) : null}
    </AuthFormFrame>
  );
}

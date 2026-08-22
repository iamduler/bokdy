"use client";

import { AuthCard, Button, Input, Label } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useLogin, useRegister } from "@/hooks/use-auth";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const router = useRouter();
  const registerUser = useRegister();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      registerSchema({
        required: te("REQUIRED"),
        emailInvalid: te("EMAIL_INVALID"),
        passwordPolicy: te("PASSWORD_POLICY"),
      }),
    [te],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    try {
      await registerUser.mutateAsync(values);
      try {
        await login.mutateAsync({ email: values.email, password: values.password });
        router.push("/dashboard");
        router.refresh();
      } catch {
        router.push("/login");
      }
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      setError(te(errorMessageKey(apiErr)));
    }
  }

  const pending = registerUser.isPending || login.isPending;

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <AuthCard title={`${tc("appName")} — ${t("registerTitle")}`}>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input id="fullName" autoComplete="name" {...register("full_name")} />
            {errors.full_name?.message ? (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email?.message ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
            {errors.password?.message ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {t("submitRegister")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link className="underline" href="/login">
              {t("submitLogin")}
            </Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}

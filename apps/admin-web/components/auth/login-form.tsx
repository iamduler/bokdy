"use client";

import {
  AuthActionButton,
  AuthAlert,
  AuthField,
  AuthPasswordField,
  Spinner,
} from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
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
import { getSession } from "@/lib/api/auth";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { safeNextPath } from "@/lib/login-return";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

const AUTH_CHANNEL = "bokdy-admin-auth";

function sessionHasUser(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as {
    user?: unknown;
    data?: { authenticated?: boolean; user?: unknown };
  };
  if (record.data?.authenticated === false) return false;
  return Boolean(record.user ?? record.data?.user);
}

function announceLogin() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage("login");
  channel.close();
}

export function LoginForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const alertRef = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const nextPath = safeNextPath(searchParams.get("next")) ?? "/organizations";

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

  useEffect(() => {
    let cancelled = false;

    async function leaveIfSignedIn() {
      if (leaving.current) return;
      try {
        const body = await getSession();
        if (cancelled || !sessionHasUser(body)) {
          if (!cancelled && !leaving.current) setCheckingSession(false);
          return;
        }
        leaving.current = true;
        router.replace(nextPath);
        router.refresh();
      } catch {
        if (!cancelled && !leaving.current) setCheckingSession(false);
      }
    }

    void leaveIfSignedIn();

    function onFocus() {
      void leaveIfSignedIn();
    }
    function onVisible() {
      if (document.visibilityState === "visible") void leaveIfSignedIn();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data === "login") void leaveIfSignedIn();
      };
    }

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      channel?.close();
    };
  }, [nextPath, router]);

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    try {
      await login.mutateAsync(values);
      announceLogin();
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      const apiErr =
        err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      setError(te(errorMessageKey(apiErr)));
    }
  }

  if (checkingSession) {
    return (
      <p className="flex items-center gap-2 text-sm text-shell-text/70">
        <Spinner />
        {tc("loading")}
      </p>
    );
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
              className="cursor-pointer text-xs font-medium text-shell-accent underline-offset-4 transition-colors duration-200"
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

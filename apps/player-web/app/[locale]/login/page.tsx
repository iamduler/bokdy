"use client";

import { AuthCard, Button, Input, Label } from "@bokdy/ui";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLogin } from "@/hooks/use-auth";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      setError(te(errorMessageKey(apiErr)));
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <AuthCard title={`${tc("appName")} — ${t("loginTitle")}`}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {t("submitLogin")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link className="underline" href={`/${locale}/register`}>
              {t("submitRegister")}
            </Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}

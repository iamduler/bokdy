"use client";

import { AuthCard, Button, Input, Label } from "@bokdy/ui";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { errorMessageKey, readApiError } from "@/lib/api/errors";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    setPending(false);
    if (!res.ok) {
      const err = await readApiError(res);
      setError(te(errorMessageKey(err)));
      return;
    }
    const login = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!login.ok) {
      router.push(`/${locale}/login`);
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <AuthCard title={`${tc("appName")} — ${t("registerTitle")}`}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <p className="text-xs text-zinc-500">{t("passwordHint")}</p>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {t("submitRegister")}
          </Button>
          <p className="text-sm text-zinc-600">
            {t("hasAccount")}{" "}
            <Link className="underline" href={`/${locale}/login`}>
              {t("submitLogin")}
            </Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}

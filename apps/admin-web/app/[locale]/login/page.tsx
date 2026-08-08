"use client";

import { AuthCard, Button, Input, Label } from "@bokdy/ui";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setPending(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
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
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {t("submitLogin")}
          </Button>
          <p className="text-sm text-zinc-600">
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

"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { getSession } from "@/lib/api/auth";
import { safeNextPath } from "@/lib/login-return";

const AUTH_CHANNEL = "bokdy-player-auth";

function sessionHasUser(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as {
    user?: unknown;
    data?: { authenticated?: boolean; user?: unknown };
  };
  if (record.data?.authenticated === false) return false;
  return Boolean(record.user ?? record.data?.user);
}

export function announceLogin() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage("login");
  channel.close();
}

export function currentNextPath(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  return safeNextPath(new URLSearchParams(window.location.search).get("next")) ?? fallback;
}

/** Hide the login form and leave when this browser already has a session. */
export function useRedirectIfSignedIn(fallback = "/dashboard") {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const leaving = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function leaveIfSignedIn() {
      if (leaving.current) return;
      const nextPath = currentNextPath(fallback);
      try {
        const body = await getSession();
        if (cancelled || !sessionHasUser(body)) {
          if (!cancelled && !leaving.current) setChecking(false);
          return;
        }
        leaving.current = true;
        router.replace(nextPath);
        router.refresh();
      } catch {
        if (!cancelled && !leaving.current) setChecking(false);
      }
    }

    void leaveIfSignedIn();

    function onVisible() {
      if (document.visibilityState === "visible") void leaveIfSignedIn();
    }
    window.addEventListener("focus", onVisible);
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
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      channel?.close();
    };
  }, [fallback, router]);

  return checking;
}

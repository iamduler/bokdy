"use client";

import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";

/** Player create is sheet-only — redirect to the directory. */
export default function NewPlayerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/users/players");
  }, [router]);

  return null;
}

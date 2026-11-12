"use client";

import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";

/** Admin create is sheet-only — redirect to the directory. */
export default function NewAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/users/admins");
  }, [router]);

  return null;
}

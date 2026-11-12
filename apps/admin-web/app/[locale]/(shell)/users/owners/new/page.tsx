"use client";

import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";

/** Owner create is sheet-only — redirect to the directory. */
export default function NewOwnerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/users/owners");
  }, [router]);

  return null;
}

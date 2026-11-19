"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

export default function LegacyHolidaysPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings");
  }, [router]);

  return null;
}

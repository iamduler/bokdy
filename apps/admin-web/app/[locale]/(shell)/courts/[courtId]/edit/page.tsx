"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

/** Court edit is sheet-only — redirect to court detail. */
export default function EditCourtPage() {
  const router = useRouter();
  const params = useParams();
  const courtId = typeof params.courtId === "string" ? params.courtId : "";

  useEffect(() => {
    if (courtId) router.replace(`/courts/${courtId}`);
  }, [courtId, router]);

  return null;
}

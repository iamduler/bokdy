"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

/** Player edit is sheet-only — redirect to the detail page. */
export default function EditPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (id) router.replace(`/users/players/${id}`);
  }, [id, router]);

  return null;
}

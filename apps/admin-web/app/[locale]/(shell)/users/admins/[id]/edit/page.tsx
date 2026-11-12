"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

/** Admin edit is sheet-only — redirect to the detail page. */
export default function EditAdminPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (id) router.replace(`/users/admins/${id}`);
  }, [id, router]);

  return null;
}

"use client";

import { UserAccountCreatePage } from "@/components/users/user-account-form-pages";

export default function NewOwnerPage() {
  return <UserAccountCreatePage audience="owners" />;
}
